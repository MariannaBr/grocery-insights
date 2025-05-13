"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";

const GROCERY_STORES = [
  "Walmart",
  "Target",
  "Whole Foods",
  "Trader Joe's",
  "Kroger",
  "Costco",
  "Safeway",
  "Albertsons",
  "Publix",
  "Aldi",
  "Lidl",
  "Other"
];

// interface UploadedReceipt {
//   sessionId: string;
//   fileName: string;
//   fileUrl: string;
//   storeName: string;
//   uploadedAt: number;
// }

export default function ReceiptUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [storeName, setStoreName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(uuidv4());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) =>
        file.type === "application/pdf" || file.type.startsWith("image/")
    );

    if (droppedFiles.length === 0) {
      setError("Please upload only PDF or image files");
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(
      (file) =>
        file.type === "application/pdf" || file.type.startsWith("image/")
    );

    if (selectedFiles.length === 0) {
      setError("Please upload only PDF or image files");
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    if (!storeName) {
      setError("Please select a store");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("storeName", storeName);
      formData.append("sessionId", sessionId);
      files.forEach((file) => {
        formData.append("file", file);
      });

      const user = auth.currentUser;
      let response;

      if (user) {
        // Authenticated upload
        const token = await user.getIdToken();
        response = await fetch("/api/receipts/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
      } else {
        // Unauthenticated upload
        response = await fetch("/api/receipts/temp-upload", {
          method: "POST",
          body: formData
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload receipts");
      }

      const data = await response.json();

      // Clear the form
      setFiles([]);
      setStoreName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (user) {
        // Redirect to profile page with success parameter
        router.push("/profile?upload=success");
      } else {
        // Show email collection modal
        router.push(`/auth/email?sessionId=${data.sessionId}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload receipts"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-6">
      <div>
        <label
          htmlFor="store"
          className="block text-sm font-medium text-gray-700"
        >
          Store Name
        </label>
        <select
          id="store"
          name="store"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          required
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Select a store</option>
          {GROCERY_STORES.map((store) => (
            <option key={store} value={store}>
              {store}
            </option>
          ))}
        </select>
      </div>

      <div
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
            >
              <span>Upload files</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                multiple
                accept=".pdf,image/*"
                className="sr-only"
                onChange={handleFileSelect}
                ref={fileInputRef}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PDF or images up to 10MB each</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Selected files:</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-md"
              >
                <span className="text-sm text-gray-600">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isUploading || files.length === 0}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isUploading || files.length === 0
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          }`}
        >
          {isUploading ? "Uploading..." : "Upload Receipts"}
        </button>
      </div>
    </form>
  );
}
