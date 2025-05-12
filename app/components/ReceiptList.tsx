"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

interface Receipt {
  id: string;
  fileName: string;
  storeName: string;
  date: string;
  totalAmount: number;
  processed: boolean;
}

export default function ReceiptList() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          throw new Error("Not authenticated");
        }

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
    };

    fetchReceipts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No receipts uploaded yet. Start by uploading your first receipt!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Your Receipts</h3>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {receipts.map((receipt) => (
            <li key={receipt.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {receipt.fileName}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {receipt.storeName} •{" "}
                      {new Date(receipt.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
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
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Total: ${receipt.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
