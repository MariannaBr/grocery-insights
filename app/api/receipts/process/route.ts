import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { extractReceiptData } from "@/lib/openai";
import { readFile } from "fs/promises";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiptIds } = await request.json();

    if (!Array.isArray(receiptIds) || receiptIds.length === 0) {
      return NextResponse.json(
        { error: "No receipt IDs provided" },
        { status: 400 }
      );
    }

    const receipts = await prisma.receipt.findMany({
      where: {
        id: { in: receiptIds },
        userId: session.user.id,
        processed: false
      }
    });

    const processedReceipts = [];

    for (const receipt of receipts) {
      try {
        const fileBuffer = await readFile(receipt.filePath);
        const receiptData = await extractReceiptData(
          fileBuffer,
          receipt.fileType
        );

        const updatedReceipt = await prisma.receipt.update({
          where: { id: receipt.id },
          data: {
            storeName: receiptData.storeName,
            date: receiptData.purchaseDate,
            totalAmount: receiptData.totalAmount,
            items: receiptData.items,
            processed: true
          }
        });

        processedReceipts.push({
          id: updatedReceipt.id,
          fileName: receipt.fileUrl.split("/").pop(),
          fileUrl: receipt.fileUrl,
          processed: true
        });
      } catch (error) {
        console.error(`Error processing receipt ${receipt.id}:`, error);
        // Continue with other receipts even if one fails
      }
    }

    return NextResponse.json(processedReceipts);
  } catch (error) {
    console.error("Error processing receipts:", error);
    return NextResponse.json(
      { error: "Failed to process receipts" },
      { status: 500 }
    );
  }
}
