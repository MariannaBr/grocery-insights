import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function Profile() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Get user's recent receipts
  const receipts = await prisma.receipt.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      date: "desc"
    },
    take: 6
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Activity
              </h3>
              <div className="mt-4">
                <Link
                  href="/receipts/upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Upload New Receipt
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recent Shopping
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {receipts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-gray-600 mb-4">
                  No receipts uploaded yet
                </p>
                <Link
                  href="/receipts/upload"
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
                >
                  Upload Your First Receipt
                </Link>
              </div>
            ) : (
              receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="border rounded-lg shadow-md bg-white p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {receipt.storeName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(receipt.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                  <p className="text-xl font-bold text-green-600 mt-2">
                    ${receipt.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {Array.isArray(receipt.items)
                      ? `${receipt.items.length} items`
                      : "No items listed"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
