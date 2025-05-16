import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";
import { extractReceiptData } from "@/lib/openai";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return new NextResponse("Session ID is required", { status: 400 });
    }

    // Get receipts for the session
    const receipts = await prisma.receipt.findMany({
      where: { tempSessionId: sessionId }
    });

    if (receipts.length === 0) {
      return new NextResponse("No receipts found", { status: 404 });
    }

    // Calculate total amount and item count
    const totalAmount = receipts.reduce(
      (sum, receipt) => sum + receipt.totalAmount,
      0
    );
    const totalItems = receipts.reduce((sum, receipt) => {
      const items = Array.isArray(receipt.items) ? receipt.items : [];
      return sum + items.length;
    }, 0);

    return NextResponse.json({
      totalAmount,
      totalItems
    });
  } catch (error) {
    console.error("Error fetching receipt summary:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get form data
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];
    const storeName = "";
    const sessionId = (formData.get("sessionId") as string) || uuidv4();

    if (!files.length) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Create temp session
    await prisma.tempSession.upsert({
      where: { id: sessionId },
      create: { id: sessionId },
      update: {}
    });

    const uploadedReceipts = [];
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
      throw new Error(
        "FIREBASE_STORAGE_BUCKET environment variable is not set"
      );
    }

    const bucket = adminStorage.bucket(storageBucket);
    if (!bucket) {
      throw new Error("Failed to initialize storage bucket");
    }

    // Process each file
    for (const file of files) {
      try {
        // Generate a unique file name
        const timestamp = Date.now();
        const fileName = `temp/${sessionId}/${timestamp}-${file.name}`;

        // Convert file to buffer
        const buffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(buffer);

        // Upload to Firebase Storage
        const fileRef = bucket.file(fileName);
        await fileRef.save(fileBuffer, {
          metadata: {
            contentType: file.type,
            metadata: {
              sessionId,
              storeName,
              uploadedAt: timestamp.toString()
            }
          }
        });

        // Get a signed URL that expires in 24 hours
        const [url] = await fileRef.getSignedUrl({
          action: "read",
          expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });

        // Create receipt record in database
        const receipt = await prisma.receipt.create({
          data: {
            tempSessionId: sessionId,
            storeName,
            date: new Date(),
            totalAmount: 0,
            fileUrl: url,
            filePath: fileName,
            fileType: file.type,
            items: [],
            processed: false
          }
        });

        uploadedReceipts.push({
          sessionId,
          fileName,
          fileUrl: url,
          storeName: storeName,
          uploadedAt: timestamp,
          totalAmount: 0,
          receiptId: receipt.id
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue with other files even if one fails
      }

      // Extract receipt data using OpenAI
      //const receiptData = await extractReceiptData(fileBuffer, file.type);

      // Create receipt record in database
      // const receipt = await prisma.receipt.create({
      //   data: {
      //     tempSessionId: sessionId,
      //     storeName: receiptData.storeName,
      //     date: receiptData.purchaseDate,
      //     totalAmount: receiptData.totalAmount,
      //     fileUrl: url,
      //     filePath: fileName,
      //     fileType: file.type,
      //     items: receiptData.items,
      //     processed: true
      //   }
      // });

      // uploadedReceipts.push({
      //   sessionId,
      //   fileName,
      //   fileUrl: url,
      //   storeName: receiptData.storeName,
      //   uploadedAt: timestamp,
      //   totalAmount: receiptData.totalAmount,
      //   itemCount: receiptData.items.length,
      //   receiptId: receipt.id
      // });
      //   } catch (error) {
      //     console.error(`Error processing file ${file.name}:`, error);
      //     // Continue with other files even if one fails
      //   }
    }

    if (uploadedReceipts.length === 0) {
      return new NextResponse("Failed to upload any receipts", { status: 500 });
    }

    if (uploadedReceipts.length === 0) {
      return new NextResponse("Failed to upload any receipts", { status: 500 });
    }

    // // Calculate total amount and item count
    // const totalAmount = uploadedReceipts.reduce(
    //   (sum, receipt) => sum + receipt.totalAmount,
    //   0
    // );
    // const totalItems = uploadedReceipts.reduce(
    //   (sum, receipt) => sum + receipt.itemCount,
    //   0
    // );

    return NextResponse.json({
      receipts: uploadedReceipts,
      sessionId
    });
  } catch (error) {
    console.error("Error uploading receipts:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}
