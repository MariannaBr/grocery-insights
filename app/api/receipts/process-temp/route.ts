import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  extractReceiptData,
  generateShoppingInsights,
  ReceiptItem
} from "@/lib/openai";

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
            date: data.date,
            totalAmount: data.totalAmount,
            totalItems: data.totalItems,
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

    const receiptsForInsights = await prisma.receipt.findMany({
      where: {
        tempSessionId: sessionId,
        processed: true
      }
    });
    console.log(receiptsForInsights);

    // Transform receipts to match ReceiptData interface
    const transformedReceipts = receiptsForInsights.map((receipt) => ({
      storeName: receipt.storeName,
      date: receipt.date,
      totalAmount: receipt.totalAmount,
      totalItems: receipt.totalItems,
      items: receipt.items as ReceiptItem[]
    }));

    // Generate insights using OpenAI
    const insights = await generateShoppingInsights(transformedReceipts);

    // Store insights in the database
    const storedInsights = await prisma.insights.create({
      data: {
        tempSessionId: sessionId,
        content: insights,
        lastUpdated: new Date()
      }
    });

    return NextResponse.json(storedInsights);
  } catch (error) {
    console.error("Error generating insights:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}
