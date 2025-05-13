import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { adminStorage } from "@/lib/firebase-admin";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    const { email, sessionId } = await request.json();
    if (!email || !sessionId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    console.log("Creating user with:", { firebaseUid, email });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: firebaseUid }
    });

    if (existingUser) {
      console.log("User already exists:", existingUser);
      return NextResponse.json({ user: existingUser });
    }

    // Create user in Prisma
    const user = await prisma.user.create({
      data: {
        id: firebaseUid,
        email,
        emailVerified: new Date()
      }
    });

    console.log("Created user:", user);

    // Get temporary session and its receipts
    const tempSession = await prisma.tempSession.findUnique({
      where: { id: sessionId },
      include: { receipts: true }
    });

    if (!tempSession) {
      console.error("Temporary session not found:", sessionId);
      return new NextResponse("Temporary session not found", { status: 404 });
    }

    console.log("Found temp session with receipts:", {
      sessionId,
      receiptCount: tempSession.receipts.length
    });

    // Get the storage bucket with explicit bucket name
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

    // Move files from temp storage to user's permanent storage
    for (const receipt of tempSession.receipts) {
      try {
        // Extract filename from the filePath
        const fileName = receipt.filePath.split("/").pop();
        if (!fileName) {
          throw new Error(`Invalid file path: ${receipt.filePath}`);
        }

        const tempFilePath = `temp/${sessionId}/${fileName}`;
        const newFilePath = `${firebaseUid}/${fileName}`;

        console.log("Processing file:", {
          receiptId: receipt.id,
          tempFilePath,
          newFilePath,
          originalFilePath: receipt.filePath
        });

        // Check if source file exists
        const [exists] = await bucket.file(tempFilePath).exists();
        if (!exists) {
          throw new Error(`Source file not found: ${tempFilePath}`);
        }

        // Copy the file to the new location
        console.log("Copying file to new location...");
        await bucket.file(tempFilePath).copy(bucket.file(newFilePath));
        console.log("File copied successfully");

        // Delete the original file from temp storage
        console.log("Deleting original file...");
        await bucket.file(tempFilePath).delete();
        console.log("Original file deleted");

        // Generate new signed URL
        console.log("Generating new signed URL...");
        const [url] = await bucket.file(newFilePath).getSignedUrl({
          action: "read",
          expires: "03-01-2500" // Far future expiration
        });
        console.log("New signed URL generated");

        // Update receipt record
        console.log("Updating receipt record...");
        await prisma.receipt.update({
          where: { id: receipt.id },
          data: {
            userId: firebaseUid,
            tempSessionId: null,
            fileUrl: url,
            filePath: newFilePath
          }
        });
        console.log("Receipt record updated successfully");
      } catch (error) {
        console.error("Error processing receipt:", {
          receiptId: receipt.id,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error; // Re-throw to handle in outer catch
      }
    }

    // Delete temporary session
    await prisma.tempSession.delete({
      where: { id: sessionId }
    });

    console.log("Successfully completed user creation and file migration");
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error creating user:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}
