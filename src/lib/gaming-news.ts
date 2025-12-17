import Parser from "rss-parser";
import axios from "axios";
import * as cheerio from "cheerio";

const parser = new Parser();

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  thumbnail?: string;
}

export async function fetchGamingNews(): Promise<NewsItem[]> {
  const news: NewsItem[] = [];

  try {
    // IGN RSS Feed
    const ignFeed = await parser.parseURL(
      "https://feeds.ign.com/ign/games-all"
    );
    news.push(
      ...(ignFeed.items?.map((item: any) => {
        // Try to get image from content field first
        let thumbnail = null;
        if (item["content:encoded"]) {
          const match = item["content:encoded"].match(
            /<img[^>]+src="([^">]+)"/
          );
          if (match) {
            thumbnail = match[1];
          }
        }
        // Fallback to media:thumbnail if available
        if (!thumbnail && item["media:thumbnail"]) {
          thumbnail =
            item["media:thumbnail"].url ||
            (Array.isArray(item["media:thumbnail"])
              ? item["media:thumbnail"][0].url
              : null);
        }
        // Final fallback to enclosure
        if (!thumbnail) {
          thumbnail = item.enclosure?.url;
        }

        return {
          title: item.title || "",
          link: item.link?.startsWith("http")
            ? item.link
            : `https://www.ign.com${item.link}` || "",
          pubDate: item.pubDate || "",
          source: "IGN",
          thumbnail: thumbnail,
        };
      }) || [])
    );

    // PC Gamer RSS Feed
    const pcGamerFeed = await parser.parseURL("https://www.pcgamer.com/rss");
    news.push(
      ...(pcGamerFeed.items?.map((item) => ({
        title: item.title || "",
        link: item.link || "",
        pubDate: item.pubDate || "",
        source: "PC Gamer",
        thumbnail: item.enclosure?.url,
      })) || [])
    );

    // Since Kotaku doesn't provide an RSS feed, we'll fetch their homepage
    const kotakuResponse = await axios.get("https://kotaku.com");
    const $ = cheerio.load(kotakuResponse.data);

    $(".js_post-wrapper").each((_, element) => {
      const title = $(element).find(".js_link-wrapper h2").text();
      const link = $(element).find(".js_link-wrapper").attr("href");
      const thumbnail = $(element).find("img").attr("src");

      if (title && link) {
        news.push({
          title,
          link,
          pubDate: new Date().toISOString(),
          source: "Kotaku",
          thumbnail,
        });
      }
    });
  } catch (error) {
    console.error("Error fetching gaming news:", error);
  }

  // Sort by publication date, most recent first
  return news.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}
