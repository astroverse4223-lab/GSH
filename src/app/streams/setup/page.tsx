"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlowCard } from "@/components/ui/GlowCard";

export default function StreamSetupPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [platform, setPlatform] = useState<"TWITCH" | "YOUTUBE">("TWITCH");
  const [streamUrl, setStreamUrl] = useState("");
  const [title, setTitle] = useState("");
  const [game, setGame] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Handle ESC key to cancel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.push("/streams");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/streams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          streamUrl,
          title,
          game,
          isLive: true,
        }),
      });

      if (response.ok) {
        router.push("/streams");
      } else {
        const data = await response.json();
        setError(data.error || "Something went wrong");
      }
    } catch (error) {
      setError("Failed to start stream");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">Please Sign In</h3>
          <p className="text-gray-500 dark:text-gray-400">
            You need to be signed in to set up streaming.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-500 transition-colors"
          title="Go back">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Streams
        </button>
        <h1 className="text-2xl font-bold">Set Up Stream</h1>
      </div>

      <GlowCard className="mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">How to Set Up Your Stream</h2>
            <button
              onClick={() => router.push("/streams")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
              title="Close">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">For YouTube:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>
                  Go to{" "}
                  <a
                    href="https://studio.youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-500 hover:underline">
                    YouTube Studio
                  </a>
                </li>
                <li>Click the "Create" button in the top right</li>
                <li>Select "Go Live"</li>
                <li>Set up your stream settings in YouTube</li>
                <li>
                  Once ready, copy the stream URL (looks like:
                  https://youtube.com/watch?v=...)
                </li>
                <li>Paste the URL below and fill in your stream details</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">For Twitch:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>
                  Go to{" "}
                  <a
                    href="https://twitch.tv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-500 hover:underline">
                    Twitch
                  </a>
                </li>
                <li>Make sure you're logged into your channel</li>
                <li>
                  Copy your channel URL (looks like:
                  https://twitch.tv/yourchannel)
                </li>
                <li>
                  Paste your channel URL below and fill in your stream details
                </li>
              </ol>
            </div>
          </div>
        </div>
      </GlowCard>

      <GlowCard>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Stream Setup</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setPlatform("TWITCH")}
                  className={`flex-1 py-2 px-4 rounded-lg border ${
                    platform === "TWITCH"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-300 dark:border-gray-700"
                  }`}>
                  Twitch
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("YOUTUBE")}
                  className={`flex-1 py-2 px-4 rounded-lg border ${
                    platform === "YOUTUBE"
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-300 dark:border-gray-700"
                  }`}>
                  YouTube
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {platform === "TWITCH"
                  ? "Twitch Channel URL"
                  : "YouTube Stream URL"}
              </label>
              <input
                type="text"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder={
                  platform === "TWITCH"
                    ? "https://twitch.tv/yourchannel"
                    : "https://youtube.com/watch?v=..."
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                required
                pattern={
                  platform === "TWITCH"
                    ? "https?:\\/\\/(?:www\\.)?twitch\\.tv\\/[a-zA-Z0-9_]+"
                    : "https?:\\/\\/(?:www\\.)?youtube\\.com\\/watch\\?v=[a-zA-Z0-9_\\-]+"
                }
              />
              <p className="mt-1 text-sm text-gray-500">
                {platform === "TWITCH"
                  ? "Enter your Twitch channel URL where you'll be streaming"
                  : "Enter your YouTube live stream URL (must be a watch URL with ?v=...)"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Stream Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a catchy title for your stream"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                required
                minLength={3}
                maxLength={100}
              />
              <p className="mt-1 text-sm text-gray-500">
                A descriptive title helps viewers find your stream
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Game (Optional)
              </label>
              <input
                type="text"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                placeholder="e.g., Minecraft, League of Legends, Just Chatting"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Adding a game helps categorize your stream and reach interested
                viewers
              </p>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/streams")}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                {isSubmitting ? "Starting Stream..." : "Start Stream"}
              </button>
            </div>
          </form>
        </div>
      </GlowCard>
    </div>
  );
}
