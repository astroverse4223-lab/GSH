"use client";

interface UploadProgressProps {
  progress: number;
  fileName: string;
  status?: "uploading" | "processing" | "complete" | "error";
  error?: string;
}

export function UploadProgress({
  progress,
  fileName,
  status = "uploading",
  error,
}: UploadProgressProps) {
  const statusText = {
    uploading: "Uploading...",
    processing: "Processing...",
    complete: "Complete!",
    error: "Error",
  };

  const progressBarColor =
    status === "error"
      ? "bg-red-500"
      : status === "complete"
      ? "bg-green-500"
      : "bg-neon-primary";

  return (
    <div className="w-full bg-gray-700 rounded-lg p-4">
      <div className="flex justify-between mb-2">
        <div className="flex flex-col">
          <span className="text-sm text-gray-300">{fileName}</span>
          <span className="text-xs text-gray-400">{statusText[status]}</span>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
        <span className="text-sm text-neon-primary">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-in-out ${progressBarColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
