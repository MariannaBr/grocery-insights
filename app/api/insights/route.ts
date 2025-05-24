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

    // const insights = await prisma.insights.findUnique({
    //   where: {
    //     userId
    //   }
    // });

    // if (!insights) {
    //   return new NextResponse("No insights found", { status: 404 });
    // }

    // return NextResponse.json(insights);
  } catch (error) {
    console.error("Error fetching insights:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}
