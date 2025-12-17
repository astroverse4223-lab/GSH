import { NextResponse } from "next/server";
import { fetchGamingNews } from "@/lib/gaming-news";

export const revalidate = 3600; // Revalidate cache every hour

export async function GET() {
  try {
    const news = await fetchGamingNews();
    return NextResponse.json(news);
  } catch (error) {
    console.error("Error fetching gaming news:", error);
    return NextResponse.json(
      { error: "Failed to fetch gaming news" },
      { status: 500 }
    );
  }
}
