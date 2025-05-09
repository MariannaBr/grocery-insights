import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

interface FileWithDetails {
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    console.log("FormData keys:", Array.from(formData.keys()));

    const files = formData.getAll("file") as unknown as FileWithDetails[];
    console.log("Files received:", files.length);

    if (!files || files.length === 0) {
      console.error("No files received in request");
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error("Error creating upload directory:", error);
    }

    const uploadedReceipts = [];

    for (const file of files) {
      try {
        // Get file details from the Blob/File object
        const fileName = file.name || `file-${Date.now()}`;
        const fileType = file.type || "application/octet-stream";

        console.log("Processing file:", {
          name: fileName,
          type: fileType,
          size: file.size
        });

        // Save file to disk
        const filePath = join(uploadDir, fileName);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Create receipt record in database
        const receipt = await prisma.receipt.create({
          data: {
            userId: session.user.id,
            storeName: "Pending",
            date: new Date(),
            totalAmount: 0,
            fileUrl: `/uploads/${fileName}`,
            filePath: filePath,
            fileType: fileType,
            items: [],
            processed: false
          }
        });

        uploadedReceipts.push({
          id: receipt.id,
          fileName: fileName,
          fileUrl: receipt.fileUrl,
          processed: false
        });
      } catch (error) {
        console.error(`Error processing file:`, error);
        // Continue with other files even if one fails
      }
    }

    if (uploadedReceipts.length === 0) {
      return NextResponse.json(
        { error: "Failed to upload any files" },
        { status: 500 }
      );
    }

    return NextResponse.json(uploadedReceipts);
  } catch (error) {
    console.error("Error in upload handler:", error);
    return NextResponse.json(
      { error: "Failed to upload receipts" },
      { status: 500 }
    );
  }
}
