"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { MarketplaceListing } from "@/components/marketplace/MarketplaceListing";
import { CreateListingModal } from "@/components/marketplace/CreateListingModal";
import RGBButton from "@/components/ui/RGBButton";
import { GlowCard } from "@/components/ui/GlowCard";
import styles from "./marketplace.module.css";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  images: { id: string; url: string }[];
  status: string;
  createdAt: Date;
  seller: {
    id: string;
    name: string;
    image: string;
  };
}

export default function MarketplacePage() {
  const { data: session } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("NEWEST");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/marketplace/listings");
      if (!response.ok) throw new Error("Failed to fetch listings");
      const data = await response.json();
      console.log("Fetched listings:", data); // Debug log
      setListings(data);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleListingCreated = () => {
    fetchListings();
  };

  const categories = [
    { id: "ALL", name: "All Items" },
    { id: "HARDWARE", name: "Hardware" },
    { id: "GAMES", name: "Games" },
    { id: "CONSOLES", name: "Consoles" },
    { id: "ACCESSORIES", name: "Accessories" },
    { id: "COLLECTIBLES", name: "Collectibles" },
    { id: "OTHER", name: "Other" },
  ];

  const filteredListings = listings
    .filter((listing) => {
      console.log("Filtering listing:", {
        listingCategory: listing.category,
        selectedCategory,
        isMatch:
          selectedCategory === "ALL" ||
          listing.category.toUpperCase() === selectedCategory.toUpperCase(),
      });
      if (selectedCategory === "ALL") return true;
      return listing.category.toUpperCase() === selectedCategory.toUpperCase();
    })
    .sort((a, b) => {
      if (sortBy === "NEWEST") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "PRICE_LOW") {
        return a.price - b.price;
      }
      if (sortBy === "PRICE_HIGH") {
        return b.price - a.price;
      }
      return 0;
    });

  const filteredItems = filteredListings.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.pageContainer}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.heroIcon}>
              <svg
                className="w-16 h-16 text-neon-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h1 className={styles.heroTitle}>Gaming Marketplace</h1>
            <p className={styles.heroSubtitle}>
              Discover, buy, and sell gaming treasures with fellow gamers
              worldwide
            </p>
            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{listings.length}</span>
                <span className={styles.statLabel}>Active Listings</span>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>
                  {new Set(listings.map((l) => l.seller.id)).size}
                </span>
                <span className={styles.statLabel}>Sellers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className={styles.controlsSection}>
          <div className={styles.searchContainer}>
            <div className={styles.searchBox}>
              <svg
                className={styles.searchIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search for games, consoles, accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.sortContainer}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.sortSelect}
                title="Sort listings">
                <option value="NEWEST">Latest First</option>
                <option value="PRICE_LOW">Price: Low to High</option>
                <option value="PRICE_HIGH">Price: High to Low</option>
              </select>
            </div>
            <RGBButton
              onClick={() => setIsCreateModalOpen(true)}
              className={styles.createButton}>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              List Item
            </RGBButton>
          </div>
        </div>

        {/* Enhanced Categories */}
        <div className={styles.categoriesSection}>
          <h3 className={styles.categoriesTitle}>Browse Categories</h3>
          <div className={styles.categoriesGrid}>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`${styles.categoryCard} ${
                  selectedCategory === category.id ? styles.categoryActive : ""
                }`}>
                <div className={styles.categoryIcon}>
                  {category.id === "ALL" && "🎮"}
                  {category.id === "HARDWARE" && "💻"}
                  {category.id === "GAMES" && "🎲"}
                  {category.id === "CONSOLES" && "🕹️"}
                  {category.id === "ACCESSORIES" && "🎧"}
                  {category.id === "COLLECTIBLES" && "🏆"}
                  {category.id === "OTHER" && "📦"}
                </div>
                <span className={styles.categoryName}>{category.name}</span>
                <span className={styles.categoryCount}>
                  (
                  {
                    listings.filter(
                      (l) =>
                        category.id === "ALL" ||
                        l.category.toUpperCase() === category.id
                    ).length
                  }
                  )
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        <div className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <h3 className={styles.resultsTitle}>
              {selectedCategory === "ALL"
                ? "All Items"
                : categories.find((c) => c.id === selectedCategory)?.name}
              <span className={styles.resultsCount}>
                ({filteredItems.length} items)
              </span>
            </h3>
            {searchQuery && (
              <div className={styles.searchIndicator}>
                Searching for:{" "}
                <span className={styles.searchTerm}>"{searchQuery}"</span>
                <button
                  onClick={() => setSearchQuery("")}
                  className={styles.clearSearch}>
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Items Grid */}
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Loading marketplace...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg
                  className="w-24 h-24"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>No items found</h3>
              <p className={styles.emptyDescription}>
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search term.`
                  : selectedCategory !== "ALL"
                  ? "No items in this category yet. Check back later or try a different category."
                  : "No listings available right now. Be the first to list an item!"}
              </p>
              {!searchQuery && (
                <RGBButton
                  onClick={() => setIsCreateModalOpen(true)}
                  className={styles.emptyAction}>
                  List First Item
                </RGBButton>
              )}
            </div>
          ) : (
            <div className={styles.itemsGrid}>
              {filteredItems.map((item) => (
                <MarketplaceListing
                  key={item.id}
                  listing={item}
                  onDelete={() =>
                    setListings(listings.filter((l) => l.id !== item.id))
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Listing Modal */}
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onListingCreated={handleListingCreated}
      />
    </div>
  );
}
