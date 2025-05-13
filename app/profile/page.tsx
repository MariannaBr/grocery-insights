"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import ReceiptUpload from "@/app/components/ReceiptUpload";
import ReceiptList from "@/app/components/ReceiptList";
import { UploadSuccess } from "@/app/components/UploadSuccess";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // Show success message if upload was successful
    if (searchParams.get("upload") === "success") {
      setShowSuccess(true);
      setShowUploadForm(false);
      // Remove the query parameter from the URL
      router.replace("/profile");
    }
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Receipts
            </h2>
            <div className="space-x-4">
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {showUploadForm ? "Cancel Upload" : "Upload New Receipts"}
              </button>
              <Link
                href="/insights"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Shopping Insights
              </Link>
            </div>
          </div>

          {showUploadForm ? (
            <div className="mb-8">
              <ReceiptUpload />
            </div>
          ) : (
            <ReceiptList />
          )}
        </div>

        {showSuccess && (
          <UploadSuccess
            onClose={() => setShowSuccess(false)}
            message="Receipts uploaded successfully! They will be processed shortly."
          />
        )}
      </div>
    </div>
  );
}
