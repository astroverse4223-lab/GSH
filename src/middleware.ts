import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/feed/:path*",
    "/groups/:path*",
    "/marketplace/:path*",
    "/users/:path*",
    "/profile/:path*",
    "/streams/:path*",
    "/news/:path*",
    "/legal/contact/:path*",
    "/api/upload/:path*",
  ],
};
