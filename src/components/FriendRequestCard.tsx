"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Check, X, User } from "lucide-react";
import styles from "./FriendRequestCard.module.css";

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image?: string;
  };
}

interface FriendRequestCardProps {
  className?: string;
}

export default function FriendRequestCard({
  className = "",
}: FriendRequestCardProps) {
  const { data: session } = useSession();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (session?.user) {
      fetchFriendRequests();
    }
  }, [session]);

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch("/api/friends/requests");
      if (response.ok) {
        const data = await response.json();
        // Filter for pending requests where current user is the receiver
        const pendingRequests = data.filter(
          (req: FriendRequest) =>
            req.status === "PENDING" && req.receiverId === session?.user?.id
        );
        setFriendRequests(pendingRequests);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async (
    requestId: string,
    action: "ACCEPT" | "REJECT"
  ) => {
    if (processingRequests.has(requestId)) return;

    setProcessingRequests((prev) => new Set(prev).add(requestId));

    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Remove the request from the list
        setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
      }
    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing friend request:`, error);
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  if (!session?.user) {
    return null;
  }

  if (loading) {
    return (
      <div className={`${styles.card} ${className}`}>
        <div className={styles.header}>
          <User className={styles.headerIcon} size={20} />
          <h3 className={styles.title}>Friend Requests</h3>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (friendRequests.length === 0) {
    return null; // Don't show the card if there are no requests
  }

  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.header}>
        <User className={styles.headerIcon} size={20} />
        <h3 className={styles.title}>Friend Requests</h3>
        <span className={styles.badge}>{friendRequests.length}</span>
      </div>

      <div className={styles.requestsList}>
        {friendRequests.map((request) => (
          <div key={request.id} className={styles.requestItem}>
            <Link
              href={`/users/${request.sender.id}`}
              className={styles.userInfo}>
              <div className={styles.avatarContainer}>
                {request.sender.image ? (
                  <Image
                    src={request.sender.image}
                    alt={request.sender.name}
                    width={40}
                    height={40}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.defaultAvatar}>
                    {request.sender.name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{request.sender.name}</span>
                <span className={styles.requestTime}>
                  {new Date(request.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>

            <div className={styles.actions}>
              <button
                onClick={() => handleRequestResponse(request.id, "ACCEPT")}
                disabled={processingRequests.has(request.id)}
                className={`${styles.actionBtn} ${styles.acceptBtn}`}
                title="Accept">
                <Check size={16} />
              </button>
              <button
                onClick={() => handleRequestResponse(request.id, "REJECT")}
                disabled={processingRequests.has(request.id)}
                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                title="Decline">
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
