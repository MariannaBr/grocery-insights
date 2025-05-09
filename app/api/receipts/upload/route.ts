import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const storeName = formData.get("storeName") as string;
    const file = formData.get("file") as File;

    if (!storeName || !file) {
      return NextResponse.json(
        { message: "Store name and file are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.type;
    if (!fileType.startsWith("image/") && fileType !== "application/pdf") {
      return NextResponse.json(
        { message: "Only images and PDFs are allowed" },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `receipts/${session.user.id}/${fileName}`;

    // Upload to Firebase Storage
    const bucket = getStorage().bucket();
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUpload = bucket.file(filePath);

    await fileUpload.save(buffer, {
      metadata: {
        contentType: fileType
      }
    });

    // Get the public URL
    const [url] = await fileUpload.getSignedUrl({
      action: "read",
      expires: "03-01-2500" // Long expiration for now
    });

    // Create receipt record in database
    const receipt = await prisma.receipt.create({
      data: {
        userId: session.user.id,
        storeName,
        fileUrl: url,
        filePath,
        fileType,
        date: new Date(), // We'll update this after OCR processing
        totalAmount: 0, // We'll update this after OCR processing
        items: [] // We'll update this after OCR processing
      }
    });

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Error uploading receipt:", error);
    return NextResponse.json(
      { message: "Error uploading receipt" },
      { status: 500 }
    );
  }
}
