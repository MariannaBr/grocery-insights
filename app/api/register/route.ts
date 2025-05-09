import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with credentials provider
    const user = await prisma.user.create({
      data: {
        email,
        accounts: {
          create: {
            type: "credentials",
            provider: "credentials",
            providerAccountId: email,
            password: hashedPassword
          }
        }
      },
      include: {
        accounts: true
      }
    });

    // Remove sensitive data from response
    const { accounts, ...userWithoutSensitiveData } = user;

    return NextResponse.json(userWithoutSensitiveData);
  } catch (error) {
    console.error("Registration error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
