"use client";

import { useState, useRef, DragEvent } from "react";
import { auth } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import InsightsProcessPanel from "./InsightsProcessPanel";

type FileWithProgress = {
  file: File;
  progress: number;
  status: "uploading" | "uploaded";
};

export default function ReceiptUpload() {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [sessionIdState, setSessionIdState] = useState<string | null>(null);
  const sessionId = useRef(uuidv4()).current;
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setFiles((prevFiles) => [
      ...prevFiles,
      ...droppedFiles.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const
      }))
    ]);
    setError(null);
    uploadFiles(droppedFiles);
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
    setFiles((prevFiles) => [
      ...prevFiles,
      ...selectedFiles.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const
      }))
    ]);
    setError(null);
    uploadFiles(selectedFiles);
  };

  const removeFile = (index: number) => {
    if (files.some((f) => f.status === "uploading")) return;
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const uploadFiles = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      const uploadPromises = selectedFiles.map((file) => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          formData.append("file", file);
          formData.append("sessionId", sessionId);
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded * 100) / event.total);
              setFiles((prevFiles) => {
                const idx = prevFiles.findIndex(
                  (f) => f.file.name === file.name
                );
                if (idx === -1) return prevFiles;
                const newFiles = [...prevFiles];
                newFiles[idx] = { ...newFiles[idx], progress };
                return newFiles;
              });
            }
          });
          xhr.onload = async () => {
            if (xhr.status === 200) {
              setFiles((prevFiles) =>
                prevFiles.map((f) =>
                  f.file.name === file.name
                    ? { ...f, progress: 100, status: "uploaded" }
                    : f
                )
              );
              resolve(xhr.responseText);
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("Upload failed"));
          const endpoint = user
            ? "/api/receipts/upload"
            : "/api/receipts/temp-upload";
          xhr.open("POST", endpoint);
          if (user) {
            user
              .getIdToken()
              .then((token) => {
                xhr.setRequestHeader("Authorization", `Bearer ${token}`);
                xhr.send(formData);
              })
              .catch(reject);
          } else {
            xhr.send(formData);
          }
        });
      });
      await Promise.all(uploadPromises);
      setSessionIdState(sessionId);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload receipts"
      );
    } finally {
      setIsUploading(false);
    }
  };

  // const handleProcessInsights = async () => {
  //   setIsProcessing(true);
  //   setError(null);
  //   setInsights(null);
  //   try {
  //     const response = await fetch("/api/receipts/process-temp", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ sessionId: sessionIdState || sessionId })
  //     });
  //     if (!response.ok) {
  //       throw new Error("Failed to process receipts and get insights");
  //     }
  //     const data = await response.json();
  //     setInsights(data);
  //   } catch (err) {
  //     setError(
  //       err instanceof Error ? err.message : "Failed to process receipts"
  //     );
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  return (
    <form className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8 flex flex-col md:flex-row gap-10 items-start">
      {/* Left: Drop area */}
      <div className="flex-1 w-full md:w-1/2 flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-8 bg-gray-50 min-h-[320px]">
        <div
          className="flex flex-col items-center justify-center w-full h-full"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center mb-4">
            <svg
              className="h-14 w-14 text-blue-400 mb-2"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 48 48"
            >
              <path
                d="M24 6v24m0 0l-8-8m8 8l8-8M6 36h36"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-lg font-medium text-gray-700 text-center">
              Drag and Drop files to upload
            </div>
            <div className="text-gray-500 text-center">or</div>
            <label
              htmlFor="file-upload"
              className="mt-2 inline-block px-6 py-2 bg-blue-500 text-white font-semibold rounded-md shadow cursor-pointer hover:bg-blue-600 transition"
            >
              Browse
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
            <div className="mt-2 text-xs text-gray-400">
              Supported files: PDF, Images (JPG, PNG, etc.)
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded mt-2 w-full text-center">
              {error}
            </div>
          )}
          {isUploading && (
            <div className="mt-4 text-blue-600 text-sm">Uploading...</div>
          )}
          {isProcessing && (
            <div className="mt-4 flex items-center gap-2 text-blue-600 text-sm">
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              Processing your receipts and extracting insights...
            </div>
          )}
          {insights && (
            <div className="mt-4 w-full bg-gray-100 rounded p-4 text-left">
              <div className="font-semibold mb-2">Insights:</div>
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(insights, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
      {/* Right: Uploaded files list */}
      <div className="flex flex-col justify-between w-full md:w-1/2 min-h-[320px] pb-8">
        <div className=" font-semibold text-gray-700 mb-3">
          Uploaded files
          <div className="mt-4">
            <ul className="space-y-3">
              {files.length === 0 && (
                <li className="text-gray-400 text-sm">No files selected.</li>
              )}
              {files.map((file, index) => {
                let icon, iconColor;
                if (file.file.type === "application/pdf") {
                  icon = (
                    <svg
                      className="h-6 w-6 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  );
                  iconColor = "text-red-400";
                } else if (
                  file.file.type &&
                  file.file.type.startsWith("image/")
                ) {
                  icon = (
                    <svg
                      className="h-6 w-6 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  );
                  iconColor = "text-blue-400";
                } else {
                  icon = (
                    <svg
                      className="h-6 w-6 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  );
                  iconColor = "text-yellow-400";
                }
                return (
                  <li
                    key={index}
                    className="flex flex-col gap-1 bg-gray-50 rounded px-3 py-2 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      {icon}
                      <span className="flex-1 truncate text-gray-700 text-sm">
                        {file.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-2 text-red-400 hover:text-red-600"
                        title="Remove file"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m2 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z"
                          />
                        </svg>
                      </button>
                    </div>
                    {file.status === "uploading" && (
                      <div className="w-full mt-1">
                        <div className="h-1 w-full bg-gray-200 rounded">
                          <div
                            className="h-1 rounded bg-green-500 transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        {sessionIdState && <InsightsProcessPanel sessionId={sessionIdState} />}
      </div>
    </form>
  );
}
