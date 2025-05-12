"use client";

import { useEffect } from "react";

interface UploadSuccessProps {
  onClose: () => void;
  message?: string;
}

export function UploadSuccess({
  onClose,
  message = "Receipts uploaded successfully!"
}: UploadSuccessProps) {
  useEffect(() => {
    // Remove the success message after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-green-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">{message}</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>
              Your receipts are being processed. You can view their status
              below.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
