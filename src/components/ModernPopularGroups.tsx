import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ModernPopularGroups.module.css";

interface Group {
  id: string;
  name: string;
  description: string;
  image?: string;
  isPrivate: boolean;
  category?: string;
  _count: {
    members: number;
    posts: number;
  };
}

interface ModernPopularGroupsProps {
  className?: string;
}

export default function ModernPopularGroups({
  className = "",
}: ModernPopularGroupsProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/groups?sort=popular&limit=3");
      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }
      const data = await response.json();
      setGroups(data || []);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Enhanced Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.iconWrapper}>
            <svg
              className={styles.headerIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.196-2.12m0 0L12 15l4.804-2.12m0 0L18 11.5M7 20H2v-2a3 3 0 015.196-2.12m0 0L12 15l-4.804-2.12m0 0L6 11.5m6 0a4 4 0 100-8 4 4 0 000 8z"
              />
            </svg>
          </div>
          <h3 className={styles.title}>Popular Groups</h3>
          <div className={styles.groupCount}>{groups.length}</div>
        </div>
        <Link href="/groups" className={styles.viewAll}>
          <span>View All</span>
          <svg
            className={styles.arrowIcon}
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={styles.groupSkeleton}>
                <div className={styles.imageSkeleton}>
                  <div className={styles.skeletonShimmer}></div>
                </div>
                <div className={styles.infoSkeleton}>
                  <div className={styles.nameSkeleton}>
                    <div className={styles.skeletonShimmer}></div>
                  </div>
                  <div className={styles.descSkeleton}>
                    <div className={styles.skeletonShimmer}></div>
                  </div>
                  <div className={styles.membersSkeleton}>
                    <div className={styles.skeletonShimmer}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className={styles.error}>
            <div className={styles.errorIcon}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className={styles.errorText}>{error}</p>
            <button onClick={fetchGroups} className={styles.retryBtn}>
              Try Again
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.196-2.12m0 0L12 15l4.804-2.12m0 0L18 11.5M7 20H2v-2a3 3 0 015.196-2.12m0 0L12 15l-4.804-2.12m0 0L6 11.5m6 0a4 4 0 100-8 4 4 0 000 8z"
                />
              </svg>
            </div>
            <h4 className={styles.emptyTitle}>No Groups Found</h4>
            <p className={styles.emptyText}>
              Start or join a gaming community today
            </p>
            <Link href="/groups/create" className={styles.createGroupBtn}>
              <svg
                className={styles.buttonIcon}
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create Group
            </Link>
          </div>
        ) : (
          <div className={styles.groupsList}>
            {groups.map((group, index) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className={`${styles.groupItem} ${styles[`delay${index}`]}`}>
                <div className={styles.groupImage}>
                  {group.image ? (
                    <Image
                      src={group.image}
                      alt={group.name}
                      width={64}
                      height={64}
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.defaultImage}>
                      <svg
                        className={styles.groupIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.196-2.12m0 0L12 15l4.804-2.12m0 0L18 11.5M7 20H2v-2a3 3 0 00-5.196-2.12m0 0L12 15l-4.804-2.12m0 0L6 11.5m6 0a4 4 0 100-8 4 4 0 000 8z"
                        />
                      </svg>
                    </div>
                  )}
                  {group.isPrivate && (
                    <div className={styles.privateBadge}>
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className={styles.groupInfo}>
                  <h4 className={styles.groupName}>{group.name}</h4>
                  <p className={styles.groupDescription}>
                    {group.description && group.description.length > 60
                      ? `${group.description.substring(0, 60)}...`
                      : group.description || "No description available"}
                  </p>
                  <div className={styles.groupMeta}>
                    <div className={styles.memberCount}>
                      <svg
                        className={styles.memberIcon}
                        viewBox="0 0 20 20"
                        fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      {group._count.members} member
                      {group._count.members !== 1 ? "s" : ""}
                    </div>
                    {group.category && (
                      <div className={styles.categoryTag}>{group.category}</div>
                    )}
                  </div>
                </div>
                <div className={styles.hoverEffect}></div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Link href="/groups" className={styles.exploreBtn}>
          <svg
            className={styles.buttonIcon}
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z"
              clipRule="evenodd"
            />
          </svg>
          Explore More Groups
        </Link>
      </div>
    </div>
  );
}
