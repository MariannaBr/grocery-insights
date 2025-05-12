import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import prisma from "@/lib/prisma";
import { extractReceiptData } from "@/lib/openai";

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    })
  });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { receiptIds } = await request.json();

    if (!receiptIds || !Array.isArray(receiptIds)) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const receipts = await prisma.receipt.findMany({
      where: {
        id: { in: receiptIds },
        userId
      }
    });

    const processedReceipts = [];

    for (const receipt of receipts) {
      try {
        const response = await fetch(receipt.fileUrl);
        const buffer = await response.arrayBuffer();
        const data = await extractReceiptData(
          Buffer.from(buffer),
          receipt.fileType
        );

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

    return NextResponse.json(processedReceipts);
  } catch (error) {
    console.error("Error processing receipts:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
