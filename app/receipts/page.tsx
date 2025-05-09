import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ReceiptItem } from "@/lib/openai";

export default async function ReceiptsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  const receipts = await prisma.receipt.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      date: "desc"
    }
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Receipts</h1>
        <Link
          href="/receipts/new"
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Upload New Receipt
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {receipts.map((receipt) => (
          <div key={receipt.id} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{receipt.storeName}</h2>
            <p className="text-gray-600 mb-2">
              {new Date(receipt.date).toLocaleDateString()}
            </p>
            <p className="text-lg font-medium mb-4">
              Total: ${receipt.totalAmount.toFixed(2)}
            </p>
            <div className="space-y-2">
              <h3 className="font-medium">Items:</h3>
              <ul className="list-disc list-inside">
                {(receipt.items as ReceiptItem[]).map((item, index) => (
                  <li key={index} className="text-gray-600">
                    {item.name} - ${item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
