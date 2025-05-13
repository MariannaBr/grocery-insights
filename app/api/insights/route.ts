import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import {
  initializeApp,
  getApps,
  cert,
  ServiceAccount
} from "firebase-admin/app";
import prisma from "@/lib/prisma";

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    // Log environment variables (without sensitive data)
    console.log("Firebase initialization - Environment check:");
    console.log(
      "FIREBASE_PROJECT_ID exists:",
      !!process.env.FIREBASE_PROJECT_ID
    );
    console.log(
      "FIREBASE_CLIENT_EMAIL exists:",
      !!process.env.FIREBASE_CLIENT_EMAIL
    );
    console.log(
      "FIREBASE_PRIVATE_KEY exists:",
      !!process.env.FIREBASE_PRIVATE_KEY
    );

    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!privateKey) {
      throw new Error("FIREBASE_PRIVATE_KEY environment variable is not set");
    }

    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID ?? "",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
      privateKey
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail) {
      throw new Error(
        `Firebase service account environment variables are not properly configured:
        projectId: ${!!serviceAccount.projectId}
        clientEmail: ${!!serviceAccount.clientEmail}`
      );
    }

    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error; // Re-throw to prevent silent failures
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const receipts = await prisma.receipt.findMany({
      where: {
        userId,
        processed: true
      },
      orderBy: {
        date: "desc"
      }
    });

    // Calculate total spending
    const totalSpending = receipts.reduce(
      (sum, receipt) => sum + receipt.totalAmount,
      0
    );

    // Calculate spending by store
    const spendingByStore = receipts.reduce((acc, receipt) => {
      const store = receipt.storeName || "Unknown Store";
      acc[store] = (acc[store] || 0) + receipt.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate spending by month
    const spendingByMonth = receipts.reduce((acc, receipt) => {
      const month = receipt.date.toISOString().slice(0, 7); // YYYY-MM format
      acc[month] = (acc[month] || 0) + receipt.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate most common items
    const itemCounts = receipts.reduce((acc, receipt) => {
      (receipt.items as Array<{ name: string }>).forEach((item) => {
        acc[item.name] = (acc[item.name] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const mostCommonItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      totalSpending,
      spendingByStore,
      spendingByMonth,
      mostCommonItems,
      totalReceipts: receipts.length
    });
  } catch (error) {
    console.error("Error fetching insights:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
