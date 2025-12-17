import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  try {
    // Get the token using next-auth
    const token = await getToken({ req: request });

    // If the user is authenticated, update their last seen timestamp
    if (token?.sub) {
      const updateLastSeen = await fetch(
        `${request.nextUrl.origin}/api/users/${token.sub}/update-activity`,
        {
          method: "POST",
        }
      );

      if (!updateLastSeen.ok) {
        console.error("Failed to update user activity");
      }
    }
  } catch (error) {
    console.error("Error in activity middleware:", error);
  }

  return NextResponse.next();
}

// Update the matcher to include all routes where you want to track activity
export const config = {
  matcher: [
    "/feed/:path*",
    "/groups/:path*",
    "/marketplace/:path*",
    "/users/:path*",
    "/profile/:path*",
    "/api/:path*",
  ],
};
