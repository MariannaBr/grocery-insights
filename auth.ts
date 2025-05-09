import CredentialsProvider from "next-auth/providers/credentials";
import { type NextAuthOptions } from "next-auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "name" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          return await prisma.user.create({
            data: {
              name: credentials.name ?? credentials.email,
              email: credentials.email,
              accounts: {
                create: {
                  type: "credentials",
                  provider: "credentials",
                  providerAccountId: credentials.email,
                  password: await bcrypt.hash(credentials.password, 10)
                }
              }
            },
            include: {
              accounts: true
            }
          });
        }

        const account = await prisma.account.findFirst({
          where: {
            userId: user.id,
            type: "credentials",
            provider: "credentials"
          }
        });

        if (!account?.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          account.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return user;
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      return { ...token, id: token.id ?? user?.id };
    },
    async session({ session, token }) {
      return { ...session, user: { ...session.user, id: token.id } };
    }
  }
} satisfies NextAuthOptions;
