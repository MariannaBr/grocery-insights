import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create 5 users with hashed passwords
  await Promise.all([
    prisma.user.create({
      data: {
        email: "alice@example.com",
        name: "Alice",
        accounts: {
          create: {
            type: "credentials",
            provider: "credentials",
            providerAccountId: "alice@example.com",
            password: await bcrypt.hash("password123", 10)
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: "bob@example.com",
        name: "Bob",
        accounts: {
          create: {
            type: "credentials",
            provider: "credentials",
            providerAccountId: "bob@example.com",
            password: await bcrypt.hash("password123", 10)
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: "charlie@example.com",
        name: "Charlie",
        accounts: {
          create: {
            type: "credentials",
            provider: "credentials",
            providerAccountId: "charlie@example.com",
            password: await bcrypt.hash("password123", 10)
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: "diana@example.com",
        name: "Diana",
        accounts: {
          create: {
            type: "credentials",
            provider: "credentials",
            providerAccountId: "diana@example.com",
            password: await bcrypt.hash("password123", 10)
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: "edward@example.com",
        name: "Edward",
        accounts: {
          create: {
            type: "credentials",
            provider: "credentials",
            providerAccountId: "edward@example.com",
            password: await bcrypt.hash("password123", 10)
          }
        }
      }
    })
  ]);

  console.log("Seeding completed.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
