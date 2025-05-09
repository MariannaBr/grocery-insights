"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";

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

interface UploadedReceipt {
  id: string;
  fileName: string;
  fileUrl: string;
  processed: boolean;
}

export default function ReceiptUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedReceipts, setUploadedReceipts] = useState<UploadedReceipt[]>(
    []
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [storeName, setStoreName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(
      (file) =>
        file.type.startsWith("image/") || file.type === "application/pdf"
    );

    if (validFiles.length !== droppedFiles.length) {
      setError("Some files were skipped. Only images and PDFs are allowed.");
    } else {
      setError(null);
    }

    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(
      (file) =>
        file.type.startsWith("image/") || file.type === "application/pdf"
    );

    if (validFiles.length !== selectedFiles.length) {
      setError("Some files were skipped. Only images and PDFs are allowed.");
    } else {
      setError(null);
    }

    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
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
      files.forEach((file) => {
        formData.append("file", file);
      });

      console.log(
        "Files to upload:",
        files.map((f) => ({
          name: f.name,
          type: f.type,
          size: f.size
        }))
      );

      const response = await fetch("/api/receipts/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Upload failed:", data);
        throw new Error(data.error || "Failed to upload receipts");
      }

      const data = await response.json();
      console.log("Upload successful:", data);

      setUploadedReceipts((prev) => [...prev, ...data]);
      setFiles([]);
      setStoreName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload receipts"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcess = async () => {
    if (uploadedReceipts.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/receipts/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          receiptIds: uploadedReceipts.map((r) => r.id)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to process receipts");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process receipts"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Upload Receipts</h2>
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label
            htmlFor="storeName"
            className="block text-sm font-medium text-gray-700"
          >
            Store Name
          </label>
          <select
            id="storeName"
            name="storeName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select a store</option>
            {GROCERY_STORES.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Receipts
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple={true}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleFileSelect}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Choose Files
              </button>
              <p className="text-sm text-gray-500">
                or drag and drop files here
              </p>
              <p className="text-xs text-gray-400">
                Supported formats: Images and PDFs
              </p>
            </div>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Selected Files:
            </h3>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between text-sm text-gray-600"
                >
                  <span>
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={files.length === 0 || isUploading || !storeName}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            files.length === 0 || isUploading || !storeName
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isUploading ? "Uploading..." : "Upload Receipts"}
        </button>
      </form>

      {uploadedReceipts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Uploaded Receipts</h3>
          <ul className="space-y-2">
            {uploadedReceipts.map((receipt) => (
              <li
                key={receipt.id}
                className="flex items-center justify-between"
              >
                <span>{receipt.fileName}</span>
                <span
                  className={
                    receipt.processed ? "text-green-500" : "text-yellow-500"
                  }
                >
                  {receipt.processed ? "Processed" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={handleProcess}
            disabled={
              isProcessing || uploadedReceipts.every((r) => r.processed)
            }
            className={`mt-4 w-full py-2 px-4 rounded-md text-white font-medium ${
              isProcessing || uploadedReceipts.every((r) => r.processed)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isProcessing ? "Processing..." : "Process Receipts"}
          </button>
        </div>
      )}
    </div>
  );
}
