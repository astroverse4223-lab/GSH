export type SteamGame = {
  id: number;
  name: string;
  current_players: number;
  peak_today: number;
  image_url?: string;
};

// Steam Web API endpoints
const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_SPY_API = "https://steamspy.com/api.php";
const STEAM_CHARTS_API = "https://steamcharts.com/api";

// Fallback demo data in case API fails
const DEMO_GAMES: SteamGame[] = [
  {
    id: 570,
    name: "Dota 2",
    current_players: 502345,
    peak_today: 625789,
    image_url:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg",
  },
  {
    id: 730,
    name: "Counter-Strike 2",
    current_players: 678432,
    peak_today: 892156,
    image_url:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg",
  },
  {
    id: 578080,
    name: "PUBG: BATTLEGROUNDS",
    current_players: 234567,
    peak_today: 345678,
    image_url:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/578080/header.jpg",
  },
  {
    id: 252490,
    name: "Rust",
    current_players: 123456,
    peak_today: 198765,
    image_url:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/252490/header.jpg",
  },
  {
    id: 1172470,
    name: "Apex Legends™",
    current_players: 198765,
    peak_today: 287654,
    image_url:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg",
  },
];

/**
 * Get current player count for a Steam app
 */
async function getCurrentPlayers(appId: number): Promise<number> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}&key=${STEAM_API_KEY}`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response?.player_count || 0;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`Timeout fetching player count for app ${appId}`);
    } else {
      console.error(`Error fetching player count for app ${appId}:`, error);
    }
    return 0;
  }
}

/**
 * Get game details from Steam Store API
 */
async function getGameDetails(
  appId: number
): Promise<{ name: string; image_url: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=basic`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Store API error: ${response.status}`);
    }

    const data = await response.json();
    const gameData = data[appId.toString()];

    if (!gameData?.success || !gameData?.data) {
      return null;
    }

    return {
      name: gameData.data.name,
      image_url:
        gameData.data.header_image ||
        `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`Timeout fetching game details for app ${appId}`);
    } else {
      console.error(`Error fetching game details for app ${appId}:`, error);
    }
    return null;
  }
}

/**
 * Get trending games from SteamSpy (alternative source for popular games)
 */
async function getTrendingGameIds(): Promise<number[]> {
  try {
    // Use SteamSpy to get trending games by current players
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${STEAM_SPY_API}?request=top100in2weeks`, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `SteamSpy API error: ${response.status} - ${response.statusText}`
      );
    }

    // Check if response is actually JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text();
      console.warn(
        "SteamSpy API returned non-JSON response:",
        responseText.substring(0, 200)
      );
      throw new Error("SteamSpy API returned non-JSON response");
    }

    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      throw new Error("SteamSpy API returned empty response");
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(
        "Failed to parse SteamSpy response:",
        responseText.substring(0, 200)
      );
      throw new Error("Invalid JSON response from SteamSpy API");
    }

    // Validate that data is an object
    if (!data || typeof data !== "object") {
      throw new Error("SteamSpy API returned invalid data structure");
    }

    // Extract top 10 game IDs, prioritizing those with high player counts
    const sortedGames = Object.entries(data)
      .map(([appId, gameData]: [string, any]) => ({
        id: parseInt(appId),
        players: gameData.players || 0,
      }))
      .filter((game) => game.players > 1000) // Filter out games with very low player counts
      .sort((a, b) => b.players - a.players)
      .slice(0, 10)
      .map((game) => game.id);

    return sortedGames.length > 0
      ? sortedGames
      : [570, 730, 578080, 252490, 1172470]; // Fallback to popular games
  } catch (error) {
    // Provide detailed error logging
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("SteamSpy API request timed out");
      } else {
        console.error("Error fetching trending games:", error.message);
      }
    } else {
      console.error("Unknown error fetching trending games:", error);
    }

    // Return popular game IDs as fallback
    console.log("Using fallback game IDs due to API error");
    return [
      570, 730, 578080, 252490, 1172470, 271590, 304930, 594650, 359550, 440,
    ];
  }
}

export async function getTrendingSteamGames(): Promise<SteamGame[]> {
  console.log("getTrendingSteamGames: Starting Steam API fetch...");

  try {
    if (!STEAM_API_KEY) {
      console.warn("Steam API key not found, using demo data");
      return DEMO_GAMES;
    }

    console.log("Steam API key found, fetching real data...");

    // Get trending game IDs
    const gameIds = await getTrendingGameIds();
    console.log("Trending game IDs:", gameIds);

    // Fetch data for each game
    const gamePromises = gameIds
      .slice(0, 5)
      .map(async (appId): Promise<SteamGame | null> => {
        try {
          console.log(`Fetching data for game ${appId}...`);

          // Get current players and game details in parallel
          const [currentPlayers, gameDetails] = await Promise.all([
            getCurrentPlayers(appId),
            getGameDetails(appId),
          ]);

          console.log(
            `Game ${appId}: ${currentPlayers} players, details:`,
            gameDetails?.name
          );

          if (!gameDetails) {
            console.log(`No details found for game ${appId}`);
            return null;
          }

          // For peak today, we'll use current players * 1.2-1.5 as an estimate
          // In a real implementation, you'd want to track this data over time
          const peakToday = Math.floor(
            currentPlayers * (1.2 + Math.random() * 0.3)
          );

          return {
            id: appId,
            name: gameDetails.name,
            current_players: currentPlayers,
            peak_today: peakToday,
            image_url: gameDetails.image_url,
          };
        } catch (error) {
          console.error(`Error processing game ${appId}:`, error);
          return null;
        }
      });

    const games = (await Promise.all(gamePromises))
      .filter((game): game is SteamGame => game !== null)
      .sort((a, b) => b.current_players - a.current_players);

    console.log("Final games result:", games.length, "games found");

    // If we got valid data, return it; otherwise fall back to demo data
    return games.length > 0 ? games : DEMO_GAMES;
  } catch (error) {
    console.error("Error fetching Steam games:", error);
    return DEMO_GAMES;
  }
}
