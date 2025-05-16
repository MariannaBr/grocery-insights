"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

interface Receipt {
  id: string;
  storeName: string;
  date: string;
  totalAmount: number;
  fileUrl: string;
  processed: boolean;
  items: Array<{ name: string; price: number }>;
}

export default function ReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await fetch("/api/receipts", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (!response.ok) {
            throw new Error("Failed to fetch receipts");
          }
          const data = await response.json();
          setReceipts(data);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch receipts"
          );
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Receipts</h1>
          <div className="mt-4">
            <Link
              href="/receipts/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Upload New Receipt
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          {error ? (
            <div className="text-center py-12">
              <p className="text-xl text-red-600">{error}</p>
            </div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-4">
                No receipts uploaded yet
              </p>
              <Link
                href="/receipts/new"
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
              >
                Upload Your First Receipt
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {receipts.map((receipt) => (
                <li key={receipt.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-gray-900 font-medium">
                        {receipt.storeName} -{" "}
                        {new Date(receipt.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        receipt.processed
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {receipt.processed ? "Processed" : "Processing"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
