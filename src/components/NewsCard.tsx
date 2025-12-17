import Image from "next/image";
import Link from "next/link";
import { NewsItem } from "@/lib/gaming-news";
import styles from "./NewsCard.module.css";

interface NewsCardProps {
  news: NewsItem;
}

export function NewsCard({ news }: NewsCardProps) {
  return (
    <Link href={news.link} target="_blank" rel="noopener noreferrer">
      <div className={styles.newsCard}>
        {news.thumbnail && (
          <div className={styles.thumbnailContainer}>
            <Image
              src={news.thumbnail}
              alt={news.title}
              width={300}
              height={169}
              className={styles.thumbnail}
            />
          </div>
        )}
        <div className={styles.content}>
          <div className={styles.source}>{news.source}</div>
          <h3 className={styles.title}>{news.title}</h3>
          <div className={styles.date}>
            {new Date(news.pubDate).toLocaleDateString()}
          </div>
        </div>
      </div>
    </Link>
  );
}
