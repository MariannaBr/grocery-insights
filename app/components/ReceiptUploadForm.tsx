"use client";

import { useState } from "react";
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

export default function ReceiptUploadForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    storeName: ""
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("storeName", formData.storeName);
      if (file) {
        formDataToSend.append("file", file);
      }

      const response = await fetch("/api/receipts/upload", {
        method: "POST",
        body: formDataToSend
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to upload receipt");
      }

      router.refresh();
      router.push("/profile");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
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
            value={formData.storeName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
          <label
            htmlFor="file"
            className="block text-sm font-medium text-gray-700"
          >
            Receipt File (Image or PDF)
          </label>
          <input
            type="file"
            id="file"
            name="file"
            onChange={handleFileChange}
            accept="image/*,.pdf"
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Supported formats: JPG, PNG, PDF
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isLoading
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          {isLoading ? "Uploading..." : "Upload Receipt"}
        </button>
      </form>
    </div>
  );
}
