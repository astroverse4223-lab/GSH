"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { GlowCard, NeonButton, Toast } from "@/components/ui";

interface GroupPost {
  id: string;
  content: string;
  authorName: string;
  groupName: string;
  groupId: string;
  createdAt: string;
  stats: {
    reactions: number;
    comments: number;
  };
}

interface MigrationData {
  groupPosts: GroupPost[];
  mainFeedPostCount: number;
  total: number;
}

export default function MigrationTool() {
  const { data: session, status } = useSession();
  const [migrationData, setMigrationData] = useState<MigrationData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");

  const showToastNotification = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  useEffect(() => {
    fetchMigrationData();
  }, []);

  const fetchMigrationData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/migrate-posts?action=list");
      const data = await response.json();

      if (data.success) {
        setMigrationData(data);
      } else {
        showToastNotification("Failed to load migration data", "error");
      }
    } catch (error) {
      showToastNotification("Error loading migration data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const migrateRecentPosts = async (count: number) => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/migrate-posts?action=migrate-recent&count=${count}`
      );
      const data = await response.json();

      if (data.success) {
        showToastNotification(`✅ ${data.message}`, "success");
        fetchMigrationData(); // Refresh data
      } else {
        showToastNotification(`❌ ${data.message}`, "error");
      }
    } catch (error) {
      showToastNotification("Migration failed", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const migrateSelectedPosts = async () => {
    if (selectedPosts.length === 0) {
      showToastNotification("Please select posts to migrate", "warning");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/migrate-posts?action=migrate-specific&postIds=${selectedPosts.join(
          ","
        )}`
      );
      const data = await response.json();

      if (data.success) {
        showToastNotification(`✅ ${data.message}`, "success");
        setSelectedPosts([]);
        fetchMigrationData(); // Refresh data
      } else {
        showToastNotification(`❌ ${data.message}`, "error");
      }
    } catch (error) {
      showToastNotification("Migration failed", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen">
        Please log in to access migration tools.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          📦 Post Migration Tool
        </h1>

        {/* Stats */}
        {migrationData && (
          <GlowCard className="p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-neon-primary">
                  {migrationData.total}
                </div>
                <div className="text-gray-400">Group Posts Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {migrationData.mainFeedPostCount}
                </div>
                <div className="text-gray-400">Main Feed Posts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">
                  {selectedPosts.length}
                </div>
                <div className="text-gray-400">Posts Selected</div>
              </div>
            </div>
          </GlowCard>
        )}

        {/* Quick Actions */}
        <GlowCard className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Migration</h2>
          <div className="flex gap-4 flex-wrap">
            <NeonButton
              onClick={() => migrateRecentPosts(3)}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700">
              Migrate 3 Recent Posts
            </NeonButton>
            <NeonButton
              onClick={() => migrateRecentPosts(5)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700">
              Migrate 5 Recent Posts
            </NeonButton>
            <NeonButton
              onClick={() => migrateRecentPosts(10)}
              disabled={isProcessing}
              className="bg-purple-600 hover:bg-purple-700">
              Migrate 10 Recent Posts
            </NeonButton>
            <NeonButton
              onClick={migrateSelectedPosts}
              disabled={isProcessing || selectedPosts.length === 0}
              className="bg-orange-600 hover:bg-orange-700">
              Migrate Selected ({selectedPosts.length})
            </NeonButton>
          </div>
        </GlowCard>

        {/* Posts List */}
        <GlowCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Available Posts for Migration
          </h2>

          {isLoading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : !migrationData || migrationData.groupPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No group posts found to migrate
            </div>
          ) : (
            <div className="space-y-4">
              {migrationData.groupPosts.map((post) => (
                <div
                  key={post.id}
                  className={`border border-gray-700 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPosts.includes(post.id)
                      ? "bg-neon-primary/10 border-neon-primary"
                      : "hover:bg-gray-800"
                  }`}
                  onClick={() => togglePostSelection(post.id)}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-neon-primary">
                          {post.authorName}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-blue-400">
                          Group: {post.groupName}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">
                        {post.content.length > 100
                          ? post.content.substring(0, 100) + "..."
                          : post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <span>{post.stats.reactions} reactions</span>
                        <span>{post.stats.comments} comments</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                        className="w-4 h-4 text-neon-primary bg-gray-700 border-gray-600 rounded focus:ring-neon-primary"
                        aria-label={`Select post by ${post.authorName}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlowCard>

        {/* Instructions */}
        <GlowCard className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">📋 Instructions</h2>
          <div className="text-gray-300 space-y-2">
            <p>
              • <strong>Quick Migration:</strong> Use the buttons above to
              migrate recent posts automatically
            </p>
            <p>
              • <strong>Selective Migration:</strong> Click posts to select
              them, then use "Migrate Selected"
            </p>
            <p>
              • <strong>Effect:</strong> Migrated posts will appear on the main
              feed (/feed) instead of only in groups
            </p>
            <p>
              • <strong>Note:</strong> Posts will still be visible in their
              original groups after migration
            </p>
          </div>
        </GlowCard>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
