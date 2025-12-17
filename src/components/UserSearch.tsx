"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { getUserImageWithFallback } from "@/lib/fallback-images";
import styles from "./UserSearch.module.css";

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const response = await fetch(
            `/api/users/search?q=${encodeURIComponent(query)}`
          );
          if (response.ok) {
            const data = await response.json();
            setResults(data);
            setIsOpen(true);
          }
        } catch (error) {
          console.error("Error searching users:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className={styles.searchContainer} ref={searchRef}>
      <div className={styles.searchInputWrapper}>
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
        <svg
          className={styles.searchIcon}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        {loading && (
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className={styles.resultsDropdown}>
          {results.map((user) => (
            <Link
              key={user.id}
              href={`/users/${user.id}`}
              className={styles.resultItem}
              onClick={() => {
                setIsOpen(false);
                setQuery("");
              }}>
              <div className={styles.userAvatar}>
                <Image
                  src={getUserImageWithFallback(user)}
                  alt={user.name || "User"}
                  width={32}
                  height={32}
                  className={styles.avatarImage}
                />
              </div>
              <span className={styles.userName}>{user.name}</span>
            </Link>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className={styles.noResults}>No users found</div>
      )}
    </div>
  );
}
