"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { GlowCard } from "@/components/ui/GlowCard";
import Image from "next/image";
import Link from "next/link";
import styles from "./ModernStreams.module.css";
import toast, { Toaster } from "react-hot-toast";
import { createPortal } from "react-dom";
import { getUserImageWithFallback } from "@/lib/fallback-images";

interface Stream {
  id: string;
  platform: string;
  streamUrl: string;
  title: string;
  game: string | null;
  isLive: boolean;
  viewCount: number;
  startedAt: string;
  user: {
    id: string;
    name: string;
    image: string;
    twitchUsername: string | null;
    youtubeChannelId: string | null;
  };
}

interface StreamModalProps {
  stream: Stream;
  isOpen: boolean;
  onClose: () => void;
}

function StreamModal({ stream, isOpen, onClose }: StreamModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getYouTubeVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const modalContent = (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer} ref={modalRef}>
        <div className={styles.modalHeader}>
          <div className={styles.streamInfo}>
            <div className={styles.userInfo}>
              <Image
                src={getUserImageWithFallback(stream.user)}
                alt={stream.user.name}
                width={48}
                height={48}
                className={styles.userAvatar}
              />
              <div>
                <h2 className={styles.streamTitle}>{stream.title}</h2>
                <p className={styles.streamerName}>{stream.user.name}</p>
              </div>
            </div>
            <div className={styles.streamMeta}>
              <div className={styles.liveIndicator}>
                <span className={styles.liveDot}></span>
                LIVE
              </div>
              <span className={styles.viewCount}>
                {stream.viewCount} viewers
              </span>
              {stream.game && (
                <span className={styles.gameName}>Playing {stream.game}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className={styles.closeButton}
            title="Close stream modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.videoContainer}>
          {stream.platform === "TWITCH" ? (
            <iframe
              src={`https://player.twitch.tv/?channel=${
                stream.user.twitchUsername
              }&parent=${
                typeof window !== "undefined"
                  ? window.location.hostname
                  : "localhost"
              }&muted=false&autoplay=false`}
              width="100%"
              height="100%"
              allowFullScreen
              className={styles.streamPlayer}
            />
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                stream.streamUrl
              )}?autoplay=0&muted=0&modestbranding=1&rel=0`}
              width="100%"
              height="100%"
              allowFullScreen
              className={styles.streamPlayer}
            />
          )}
        </div>

        <div className={styles.modalActions}>
          <a
            href={stream.streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.externalLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Open on {stream.platform === "TWITCH" ? "Twitch" : "YouTube"}
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default function ModernStreams() {
  const { data: session } = useSession();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [filter, setFilter] = useState<"ALL" | "TWITCH" | "YOUTUBE">("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "viewers" | "title">(
    "newest"
  );

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const response = await fetch("/api/streams");
        if (response.ok) {
          const data = await response.json();
          setStreams(data);
        }
      } catch (error) {
        console.error("Error fetching streams:", error);
        toast.error("Failed to load streams");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreams();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteStream = async (streamId: string) => {
    if (!confirm("Are you sure you want to end this stream?")) {
      return;
    }

    try {
      const response = await fetch(`/api/streams/${streamId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setStreams(streams.filter((stream) => stream.id !== streamId));
        if (selectedStream?.id === streamId) {
          setSelectedStream(null);
        }
        toast.success("Stream ended successfully!");
      } else {
        toast.error("Failed to end stream");
      }
    } catch (error) {
      console.error("Error deleting stream:", error);
      toast.error("Failed to end stream");
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const started = new Date(dateString);
    const diffMs = now.getTime() - started.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const filteredAndSortedStreams = streams
    .filter((stream) => {
      if (filter === "ALL") return true;
      return stream.platform === filter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "viewers":
          return b.viewCount - a.viewCount;
        case "title":
          return a.title.localeCompare(b.title);
        case "newest":
        default:
          return (
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
          );
      }
    });

  return (
    <div className={styles.container}>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgba(15, 15, 15, 0.95)",
            color: "#fff",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Live Streams</h1>
            {!isLoading && (
              <div className={styles.stats}>
                <span className={styles.liveCount}>
                  {streams.length} live now
                </span>
                <div className={styles.livePulse}></div>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Sort */}
        <div className={styles.controls}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Platform:</span>
            <div className={styles.filterButtons}>
              {(["ALL", "TWITCH", "YOUTUBE"] as const).map((platform) => (
                <button
                  key={platform}
                  onClick={() => setFilter(platform)}
                  className={`${styles.filterButton} ${
                    filter === platform ? styles.active : ""
                  }`}>
                  {platform === "ALL"
                    ? "All"
                    : platform === "TWITCH"
                    ? "Twitch"
                    : "YouTube"}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.sortGroup}>
            <span className={styles.sortLabel}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={styles.sortSelect}>
              <option value="newest">Newest</option>
              <option value="viewers">Most Viewers</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stream Grid */}
      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonVideo}></div>
              <div className={styles.skeletonContent}>
                <div className={styles.skeletonLine}></div>
                <div className={styles.skeletonLine}></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedStreams.length > 0 ? (
        <div className={styles.grid}>
          {filteredAndSortedStreams.map((stream) => (
            <GlowCard key={stream.id} className={styles.streamCard}>
              <div
                className={styles.streamPreview}
                onClick={() => setSelectedStream(stream)}>
                <div className={styles.thumbnailContainer}>
                  {stream.platform === "TWITCH" ? (
                    <div className={styles.thumbnail}>
                      <img
                        src={`https://static-cdn.jtvnw.net/previews-ttv/live_user_${stream.user.twitchUsername}-440x248.jpg`}
                        alt={stream.title}
                        className={styles.thumbnailImage}
                      />
                    </div>
                  ) : (
                    <div className={styles.thumbnail}>
                      <img
                        src={`https://img.youtube.com/vi/${
                          stream.streamUrl.match(
                            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
                          )?.[1] || ""
                        }/maxresdefault.jpg`}
                        alt={stream.title}
                        className={styles.thumbnailImage}
                      />
                    </div>
                  )}
                  <div className={styles.playOverlay}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
                    </svg>
                  </div>
                  <div className={styles.streamBadges}>
                    <span className={styles.liveBadge}>LIVE</span>
                    <span className={styles.platformBadge}>
                      {stream.platform}
                    </span>
                  </div>
                  <div className={styles.duration}>
                    {getTimeAgo(stream.startedAt)}
                  </div>
                </div>
              </div>

              <div className={styles.streamInfo}>
                <div className={styles.streamerSection}>
                  <Image
                    src={getUserImageWithFallback(stream.user)}
                    alt={stream.user.name}
                    width={40}
                    height={40}
                    className={styles.streamerAvatar}
                  />
                  <div className={styles.streamerInfo}>
                    <h3 className={styles.streamTitle}>{stream.title}</h3>
                    <p className={styles.streamerName}>{stream.user.name}</p>
                    {stream.game && (
                      <p className={styles.gameName}>{stream.game}</p>
                    )}
                  </div>
                </div>

                <div className={styles.streamActions}>
                  <div className={styles.viewerCount}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    {stream.viewCount}
                  </div>

                  <div className={styles.actionButtons}>
                    {session?.user?.id === stream.user.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStream(stream.id);
                        }}
                        className={styles.endStreamButton}
                        title="End Stream">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none">
                          <path
                            d="M18 6L6 18M6 6L18 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}
                    <a
                      href={stream.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.externalButton}
                      title="Open in new tab"
                      onClick={(e) => e.stopPropagation()}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none">
                        <path
                          d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No Live Streams</h3>
          <p className={styles.emptyDescription}>
            No one is streaming right now. Be the first to go live!
          </p>
          {session?.user && (
            <Link href="/streams/setup" className={styles.emptyAction}>
              Start Your Stream
            </Link>
          )}
        </div>
      )}

      {/* Stream Modal */}
      {selectedStream && (
        <StreamModal
          stream={selectedStream}
          isOpen={!!selectedStream}
          onClose={() => setSelectedStream(null)}
        />
      )}
    </div>
  );
}
