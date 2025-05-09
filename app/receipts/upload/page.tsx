"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReceiptUploadForm from "@/app/components/ReceiptUploadForm";

export default function UploadReceipt() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Receipt</h1>
          <p className="mt-2 text-gray-600">
            Upload your grocery receipt to track your spending
          </p>
        </div>

        <ReceiptUploadForm />
      </div>
    </div>
  );
}
