"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

interface Receipt {
  id: string;
  processed: boolean;
}

interface SpendingByStore {
  [key: string]: number;
}

interface SpendingByMonth {
  [key: string]: number;
}

interface CommonItem {
  name: string;
  count: number;
}

interface Insights {
  totalSpending: number;
  totalReceipts: number;
  spendingByStore: SpendingByStore;
  spendingByMonth: SpendingByMonth;
  mostCommonItems: CommonItem[];
  content: string;
  lastUpdated: string;
}

export default function InsightsPage() {
  const router = useRouter();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingReceipts, setProcessingReceipts] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/insights", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No insights found, that's okay
          setInsights(null);
        } else {
          throw new Error("Failed to fetch insights");
        }
      } else {
        const data = await response.json();
        setInsights(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch insights");
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    try {
      setGenerating(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/insights/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to generate insights");
      }

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate insights"
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Loading Insights
            </h1>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
            </div>
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
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: insights.content }} />
                <p className="text-sm text-gray-500 mt-4">
                  Last updated:{" "}
                  {new Date(insights.lastUpdated).toLocaleString()}
                </p>
              </div>
              <button
                onClick={generateInsights}
                disabled={generating}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {generating ? "Generating..." : "Refresh Insights"}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                No Insights Yet
              </h2>
              <p className="text-gray-600 mb-6">
                Generate insights from your shopping history to see patterns and
                recommendations.
              </p>
              <button
                onClick={generateInsights}
                disabled={generating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Insights"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
