import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractReceiptData } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return new NextResponse("Session ID is required", { status: 400 });
    }

    // Find all unprocessed receipts for this session
    const receipts = await prisma.receipt.findMany({
      where: {
        tempSessionId: sessionId,
        processed: false
      }
    });

    const processedReceipts = [];

    for (const receipt of receipts) {
      try {
        // Download the file
        const response = await fetch(receipt.fileUrl);
        const buffer = await response.arrayBuffer();
        // Extract data using OpenAI
        const data = await extractReceiptData(
          Buffer.from(buffer),
          receipt.fileType
        );

        // Update the receipt in the DB
        const updatedReceipt = await prisma.receipt.update({
          where: { id: receipt.id },
          data: {
            storeName: data.storeName,
            date: data.purchaseDate,
            totalAmount: data.totalAmount,
            items: data.items,
            processed: true
          }
        });

        processedReceipts.push(updatedReceipt);
      } catch (error) {
        console.error(`Error processing receipt ${receipt.id}:`, error);
        // Continue with other receipts even if one fails
      }
    }

    // Optionally, calculate insights here (e.g., total spent, item count, etc.)
    const totalAmount = processedReceipts.reduce(
      (sum, r) => sum + (r.totalAmount || 0),
      0
    );
    const totalItems = processedReceipts.reduce(
      (sum, r) => sum + (Array.isArray(r.items) ? r.items.length : 0),
      0
    );

    return NextResponse.json({
      receipts: processedReceipts,
      insights: {
        totalAmount,
        totalItems
      }
    });
  } catch (error) {
    console.error("Error processing temp receipts:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}
