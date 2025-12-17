import { fetchGamingNews } from "@/lib/gaming-news";
import { NewsCard } from "@/components/NewsCard";

export const revalidate = 3600; // Revalidate every hour

export default async function GamingNewsPage() {
  const news = await fetchGamingNews();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Gaming News</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item, index) => (
          <NewsCard key={item.link + index} news={item} />
        ))}
      </div>
    </div>
  );
}
