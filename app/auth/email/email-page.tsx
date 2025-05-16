"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";

interface ReceiptSummary {
  totalAmount: number;
  totalItems: number;
}

function EmailForm() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [receiptSummary, setReceiptSummary] = useState<ReceiptSummary | null>(
    null
  );

  useEffect(() => {
    const fetchReceiptSummary = async () => {
      if (!sessionId) return;

      try {
        const response = await fetch(
          `/api/receipts/temp-upload?sessionId=${sessionId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch receipt summary");
        }
        const data = await response.json();
        setReceiptSummary({
          totalAmount: data.totalAmount,
          totalItems: data.totalItems
        });
      } catch (err) {
        console.error("Error fetching receipt summary:", err);
      }
    };

    fetchReceiptSummary();
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const auth = getAuth();
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/verify?sessionId=${sessionId}`,
        handleCodeInApp: true
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      // Save email to localStorage to use it when user clicks the link
      window.localStorage.setItem("emailForSignIn", email);
      setSuccess(true);
    } catch (err) {
      console.error("Error sending magic link:", err);
      setError(
        err instanceof Error ? err.message : "Failed to send magic link"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We&apos;ve sent a magic link to {email}. Click the link to access
            your insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Save your insights
        </h2>
        {receiptSummary && (
          <div className="mt-4 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Receipt Summary
            </h3>
            <div className="space-y-2">
              <p className="text-gray-600">
                Total Amount: ${receiptSummary.totalAmount.toFixed(2)}
              </p>
              <p className="text-gray-600">
                Total Items: {receiptSummary.totalItems}
              </p>
            </div>
          </div>
        )}
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email to save your receipt insights and track your grocery
          spending over time.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                }`}
              >
                {isLoading ? "Sending..." : "Send Magic Link"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <EmailForm />
    </Suspense>
  );
}
