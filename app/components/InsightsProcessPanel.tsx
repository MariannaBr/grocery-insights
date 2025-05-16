import { useState } from "react";

interface InsightsProcessPanelProps {
  sessionId: string;
}

export default function InsightsProcessPanel({
  sessionId
}: InsightsProcessPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [insights, setInsights] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcessInsights = async () => {
    setIsProcessing(true);
    setError(null);
    setInsights(null);
    try {
      const response = await fetch("/api/receipts/process-temp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      if (!response.ok) {
        throw new Error("Failed to process receipts and get insights");
      }
      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process receipts"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-4 w-full flex justify-center">
      <button
        type="button"
        onClick={handleProcessInsights}
        className="mt-2 px-8 py-4 bg-blue-600 text-white rounded-md text-lg font-semibold shadow hover:bg-blue-700 transition"
        disabled={isProcessing}
      >
        Learn the Insights
      </button>
      {isProcessing && (
        <div className="mt-4 flex items-center gap-2 text-blue-600 text-sm">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
      {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
      {insights && (
        <div className="mt-4 w-full bg-gray-100 rounded p-4 text-left">
          <div className="font-semibold mb-2">Insights:</div>
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(insights, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
