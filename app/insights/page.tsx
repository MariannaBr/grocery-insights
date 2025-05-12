"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";

export default function InsightsPage() {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingReceipts, setProcessingReceipts] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const processAndFetchInsights = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          throw new Error("Not authenticated");
        }

        // First, get unprocessed receipts
        const receiptsResponse = await fetch("/api/receipts", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!receiptsResponse.ok) {
          throw new Error("Failed to fetch receipts");
        }

        const receipts = await receiptsResponse.json();
        const unprocessedReceipts = receipts.filter((r: any) => !r.processed);

        // If there are unprocessed receipts, process them first
        if (unprocessedReceipts.length > 0) {
          setProcessingReceipts(true);
          const processResponse = await fetch("/api/receipts/process", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              receiptIds: unprocessedReceipts.map((r: any) => r.id)
            })
          });

          if (!processResponse.ok) {
            throw new Error("Failed to process receipts");
          }
        }

        // Now fetch the insights
        const insightsResponse = await fetch("/api/insights", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!insightsResponse.ok) {
          throw new Error("Failed to fetch insights");
        }

        const data = await insightsResponse.json();
        setInsights(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch insights"
        );
      } finally {
        setLoading(false);
        setProcessingReceipts(false);
      }
    };

    processAndFetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              {processingReceipts
                ? "Processing Your Receipts"
                : "Analyzing Your Shopping Patterns"}
            </h1>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
            </div>
            {processingReceipts && (
              <p className="mt-4 text-gray-600">
                Please wait while we process your receipts. This may take a few
                moments...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Shopping Insights
            </h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800 mb-4">{error}</p>
              <Link
                href="/profile"
                className="text-blue-600 hover:text-blue-800"
              >
                Return to Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Your Shopping Insights
          </h1>
          <Link href="/profile" className="text-blue-600 hover:text-blue-800">
            ← Back to Profile
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {insights ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Overview
                </h2>
                <p className="text-gray-700">
                  Total Spending: ${insights.totalSpending.toFixed(2)}
                </p>
                <p className="text-gray-700">
                  Total Receipts: {insights.totalReceipts}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Spending by Store
                </h2>
                <div className="space-y-2">
                  {Object.entries(insights.spendingByStore).map(
                    ([store, amount]) => (
                      <p key={store} className="text-gray-700">
                        {store}: ${(amount as number).toFixed(2)}
                      </p>
                    )
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Monthly Spending
                </h2>
                <div className="space-y-2">
                  {Object.entries(insights.spendingByMonth).map(
                    ([month, amount]) => (
                      <p key={month} className="text-gray-700">
                        {month}: ${(amount as number).toFixed(2)}
                      </p>
                    )
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Most Common Items
                </h2>
                <div className="space-y-2">
                  {insights.mostCommonItems.map(
                    (item: { name: string; count: number }) => (
                      <p key={item.name} className="text-gray-700">
                        {item.name}: {item.count} times
                      </p>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center">
              No insights available. Please upload and process some receipts
              first.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
