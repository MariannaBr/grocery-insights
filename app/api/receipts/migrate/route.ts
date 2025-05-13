import { NextResponse } from "next/server";
import { adminAuth, adminStorage } from "@/lib/firebase-admin";
import prisma from "@/lib/prisma";

interface FileMetadata {
  storeName: string;
  uploadedAt: string;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { sessionId } = await request.json();
    if (!sessionId) {
      return new NextResponse("Session ID is required", { status: 400 });
    }

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

    const [files] = await bucket.getFiles({
      prefix: `temp/${sessionId}/`
    });

    const migratedReceipts = [];

    for (const file of files) {
      try {
        // Get file metadata
        const [metadata] = await file.getMetadata();
        const fileMetadata = metadata.metadata as unknown as FileMetadata;
        const { storeName, uploadedAt } = fileMetadata;

        // Generate new permanent path
        const newPath = `${userId}/${Date.now()}-${file.name.split("/").pop()}`;
        const newFile = bucket.file(newPath);

        // Copy file to permanent location
        await file.copy(newPath);

        // Get a signed URL that expires in 10 years
        const [url] = await newFile.getSignedUrl({
          action: "read",
          expires: "03-01-2500"
        });

        // Create receipt record in database
        const receipt = await prisma.receipt.create({
          data: {
            userId,
            storeName,
            date: new Date(parseInt(uploadedAt)),
            totalAmount: 0,
            fileUrl: url,
            filePath: newPath,
            fileType: metadata.contentType || "application/octet-stream",
            items: [],
            processed: false
          }
        });

        // Delete temporary file
        await file.delete();

        migratedReceipts.push(receipt);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    if (migratedReceipts.length === 0) {
      return new NextResponse("No files were migrated", { status: 404 });
    }

    return NextResponse.json(migratedReceipts);
  } catch (error) {
    console.error("Error migrating receipts:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}
