import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Popular gaming suggestions for quick templates
const GAMING_SUGGESTIONS = {
  games: [
    "Counter-Strike 2",
    "Dota 2",
    "League of Legends",
    "Valorant",
    "Apex Legends",
    "Fortnite",
    "Rocket League",
    "Overwatch 2",
    "Call of Duty",
    "FIFA 24",
    "Minecraft",
    "World of Warcraft",
    "Cyberpunk 2077",
    "Elden Ring",
    "Baldur's Gate 3",
    "Diablo IV",
    "Street Fighter 6",
    "Tekken 8",
    "Mortal Kombat 1",
    "The Last of Us Part II",
  ],
  platforms: [
    "PC",
    "PlayStation 5",
    "Xbox Series X/S",
    "Nintendo Switch",
    "Mobile",
    "Steam Deck",
  ],
  activities: [
    "looking for teammates",
    "hosting a tournament",
    "doing speedruns",
    "achievement hunting",
    "streaming",
    "learning the game",
    "casual play",
    "competitive ranked",
    "custom lobbies",
  ],
  achievements: [
    "reached a new rank",
    "completed the campaign",
    "got a perfect score",
    "won a tournament",
    "unlocked rare achievement",
    "beat a boss",
    "completed a challenge",
    "set a new record",
  ],
  moods: [
    { emoji: "😎", label: "Confident", color: "#3b82f6" },
    { emoji: "😤", label: "Competitive", color: "#ef4444" },
    { emoji: "😂", label: "Having Fun", color: "#f59e0b" },
    { emoji: "🤔", label: "Strategic", color: "#8b5cf6" },
    { emoji: "😨", label: "Nervous", color: "#6b7280" },
    { emoji: "🔥", label: "On Fire", color: "#dc2626" },
    { emoji: "😴", label: "Chill", color: "#10b981" },
    { emoji: "🤬", label: "Tilted", color: "#f97316" },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const query = searchParams.get("q")?.toLowerCase() || "";

    let suggestions: any = {};

    switch (type) {
      case "games":
        suggestions = {
          games: GAMING_SUGGESTIONS.games
            .filter((game) => game.toLowerCase().includes(query))
            .slice(0, 10),
        };
        break;

      case "platforms":
        suggestions = {
          platforms: GAMING_SUGGESTIONS.platforms.filter((platform) =>
            platform.toLowerCase().includes(query)
          ),
        };
        break;

      case "activities":
        suggestions = {
          activities: GAMING_SUGGESTIONS.activities
            .filter((activity) => activity.toLowerCase().includes(query))
            .slice(0, 8),
        };
        break;

      case "achievements":
        suggestions = {
          achievements: GAMING_SUGGESTIONS.achievements
            .filter((achievement) => achievement.toLowerCase().includes(query))
            .slice(0, 8),
        };
        break;

      case "moods":
        suggestions = {
          moods: GAMING_SUGGESTIONS.moods,
        };
        break;

      default:
        // Return all suggestions for the enhanced post creator
        suggestions = GAMING_SUGGESTIONS;
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Error fetching gaming suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}

// Add new gaming suggestion (for admin use)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, value } = await request.json();

    if (!type || !value) {
      return NextResponse.json(
        { error: "Type and value are required" },
        { status: 400 }
      );
    }

    // In a real app, you'd save this to database
    // For now, just return success
    return NextResponse.json({
      message: "Suggestion added successfully",
      type,
      value,
    });
  } catch (error) {
    console.error("Error adding gaming suggestion:", error);
    return NextResponse.json(
      { error: "Failed to add suggestion" },
      { status: 500 }
    );
  }
}
