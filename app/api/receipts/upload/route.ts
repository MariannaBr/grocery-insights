import { NextResponse } from "next/server";
import { adminAuth, adminStorage } from "@/lib/firebase-admin";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get form data
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];
    const storeName = formData.get("storeName") as string;

    if (!files.length || !storeName) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const uploadedReceipts = [];
    const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET);

    // Process each file
    for (const file of files) {
      try {
        // Generate a unique file name
        const timestamp = Date.now();
        const fileName = `${userId}/${timestamp}-${file.name}`;

        // Convert file to buffer
        const buffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(buffer);

        // Upload to Firebase Storage
        const fileRef = bucket.file(fileName);
        await fileRef.save(fileBuffer, {
          metadata: {
            contentType: file.type,
            metadata: {
              userId,
              storeName,
              uploadedAt: timestamp.toString()
            }
          }
        });

        // Get a signed URL that expires in 10 years
        const [url] = await fileRef.getSignedUrl({
          action: "read",
          expires: "03-01-2500"
        });

        // Create receipt record in database
        const receipt = await prisma.receipt.create({
          data: {
            userId,
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

        uploadedReceipts.push(receipt);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    if (uploadedReceipts.length === 0) {
      return new NextResponse("Failed to upload any receipts", { status: 500 });
    }

    return NextResponse.json(uploadedReceipts);
  } catch (error) {
    console.error("Error uploading receipts:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}
