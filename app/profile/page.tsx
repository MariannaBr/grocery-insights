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

  // Check if user has completed their profile
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      name: true,
      age: true,
      location: true,
      householdSize: true,
      preferredStore: true
    }
  });

  // If user hasn't completed their profile, redirect to profile setup
  if (
    !user?.name ||
    !user?.age ||
    !user?.location ||
    !user?.householdSize ||
    !user?.preferredStore
  ) {
    redirect("/profile/setup");
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
                Personal Info
              </h3>
              <dl className="mt-4 space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Age</dt>
                  <dd className="text-sm text-gray-900">{user.age}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Location
                  </dt>
                  <dd className="text-sm text-gray-900">{user.location}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Household Size
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {user.householdSize}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Preferred Store
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {user.preferredStore}
                  </dd>
                </div>
              </dl>
              <div className="mt-4">
                <Link
                  href="/profile/edit"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Edit Profile
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
