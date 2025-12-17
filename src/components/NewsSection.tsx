import { useEffect, useState } from "react";
import { NewsItem } from "@/lib/gaming-news";
import { NewsCard } from "@/components/NewsCard";
import Link from "next/link";

export function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const response = await fetch("/api/news");
        const data = await response.json();
        setNews(data.slice(0, 3)); // Show only top 3 news items in feed
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNews();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-48 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-48 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-48 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Gaming News</h2>
        <Link href="/news" className="text-sm text-primary hover:underline">
          View all news →
        </Link>
      </div>
      <div className="space-y-4">
        {news.map((item, index) => (
          <NewsCard key={item.link + index} news={item} />
        ))}
      </div>
    </div>
  );
}
