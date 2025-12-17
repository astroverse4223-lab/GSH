"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./users.module.css";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: string;
  banned: boolean;
  banReason?: string;
  bannedAt?: string;
  role: "USER" | "ADMIN" | "MODERATOR";
  _count: {
    posts: number;
    followers: number;
    following: number;
    reports: number;
  };
}

interface BanModalProps {
  user: User | null;
  onClose: () => void;
  onBan: (userId: string, reason: string, duration?: number) => void;
}

function BanModal({ user, onClose, onBan }: BanModalProps) {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<number | undefined>();
  const [customReason, setCustomReason] = useState("");

  const predefinedReasons = [
    "Harassment or bullying",
    "Spam or unwanted content",
    "Inappropriate content",
    "Hate speech",
    "Impersonation",
    "Terms of service violation",
    "Custom reason",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === "Custom reason" ? customReason : reason;
    if (finalReason.trim() && user) {
      onBan(user.id, finalReason, duration);
      onClose();
    }
  };

  if (!user) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Ban User: {user.name}</h3>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.inputGroup}>
            <label>Reason for ban:</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required>
              <option value="">Select a reason...</option>
              {predefinedReasons.map((reasonOption) => (
                <option key={reasonOption} value={reasonOption}>
                  {reasonOption}
                </option>
              ))}
            </select>
          </div>

          {reason === "Custom reason" && (
            <div className={styles.inputGroup}>
              <label>Custom reason:</label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter custom ban reason..."
                required
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label>Ban duration (optional):</label>
            <select
              value={duration || ""}
              onChange={(e) =>
                setDuration(e.target.value ? Number(e.target.value) : undefined)
              }>
              <option value="">Permanent</option>
              <option value="1">1 day</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </select>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.banButton}>
              Ban User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "BANNED">(
    "ALL"
  );
  const [banModalUser, setBanModalUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Check if user is admin
  const isAdmin = session?.user?.email === "countryboya20@gmail.com";

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (!isAdmin) {
      router.push("/");
      return;
    }

    fetchUsers();
  }, [session, status, isAdmin, router, currentPage, searchTerm, filterStatus]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        status: filterStatus,
        limit: "20",
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (
    userId: string,
    reason: string,
    duration?: number
  ) => {
    try {
      // Find the user object from the current users list
      const user = users.find((u) => u.id === userId);
      if (!user) {
        console.error("User not found for banning");
        return;
      }
      const response = await fetch("/api/admin/ban-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.name, reason, duration }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
        setBanModalUser(null);
      }
    } catch (error) {
      console.error("Failed to ban user:", error);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/unban-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to unban user:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading users...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "BANNED" && user.banned) ||
      (filterStatus === "ACTIVE" && !user.banned);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>User Management</h1>
        <p className={styles.subtitle}>
          Manage user accounts, bans, and permissions
        </p>
      </div>

      {/* Search and Filters */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterBox}>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as "ALL" | "ACTIVE" | "BANNED")
            }
            className={styles.filterSelect}>
            <option value="ALL">All Users</option>
            <option value="ACTIVE">Active Users</option>
            <option value="BANNED">Banned Users</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <table className={styles.usersTable}>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Posts</th>
              <th>Followers</th>
              <th>Reports</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className={user.banned ? styles.bannedRow : ""}>
                <td className={styles.userCell}>
                  <div className={styles.userInfo}>
                    <img
                      src={user.image || "/images/default-avatar.png"}
                      alt={user.name}
                      className={styles.userAvatar}
                    />
                    <div>
                      <div className={styles.userName}>{user.name}</div>
                      <div className={styles.userRole}>{user.role}</div>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>{user._count.posts}</td>
                <td>{user._count.followers}</td>
                <td>{user._count.reports}</td>
                <td>
                  {user.banned ? (
                    <span className={styles.bannedBadge}>BANNED</span>
                  ) : (
                    <span className={styles.activeBadge}>ACTIVE</span>
                  )}
                </td>
                <td className={styles.actionCell}>
                  {user.banned ? (
                    <button
                      onClick={() => handleUnbanUser(user.id)}
                      className={styles.unbanButton}>
                      Unban
                    </button>
                  ) : (
                    <button
                      onClick={() => setBanModalUser(user)}
                      className={styles.banButton}
                      disabled={user.role === "ADMIN"}>
                      Ban
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className={styles.noResults}>
            <p>No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={styles.paginationButton}>
          Previous
        </button>

        <span className={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
          disabled={currentPage === totalPages}
          className={styles.paginationButton}>
          Next
        </button>
      </div>

      {/* Ban Modal */}
      <BanModal
        user={banModalUser}
        onClose={() => setBanModalUser(null)}
        onBan={handleBanUser}
      />
    </div>
  );
}
