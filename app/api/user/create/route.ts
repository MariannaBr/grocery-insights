import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { uid: id, email } = decodedToken;

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    // Check if user already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (existingUser) {
      return NextResponse.json(existingUser);
    }

    // Create new user in our database
    const user = await prisma.user.create({
      data: {
        id,
        email,
        accounts: {
          create: {
            type: "firebase",
            provider: "firebase",
            providerAccountId: id
          }
        }
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
