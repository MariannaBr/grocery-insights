"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, signInWithEmailLink } from "firebase/auth";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const auth = getAuth();
        const email = window.localStorage.getItem("emailForSignIn");

        if (!email || !sessionId) {
          throw new Error("Missing email or session ID");
        }

        // Complete the sign-in process
        const result = await signInWithEmailLink(
          auth,
          email,
          window.location.href
        );

        // Clear the email from localStorage
        window.localStorage.removeItem("emailForSignIn");

        // Get the ID token
        const token = await result.user.getIdToken();
        if (!token) {
          throw new Error("Failed to get authentication token");
        }

        // Create user in Prisma and link receipts
        const response = await fetch("/api/user/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            email: result.user.email,
            sessionId
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(
            `Failed to create user and link receipts: ${errorData}`
          );
        }

        // Redirect to profile page
        router.push("/profile?migration=success");
      } catch (err) {
        console.error("Verification error:", err);
        setError(err instanceof Error ? err.message : "Failed to verify email");
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [router, sessionId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
            <p className="font-medium">Error</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-sm">
              Please try again or contact support if the problem persists.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isLoading
              ? "Verifying your email and setting up your account..."
              : "Redirecting to your profile..."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
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
      <VerifyForm />
    </Suspense>
  );
}
