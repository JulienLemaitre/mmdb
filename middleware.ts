import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // This is the middleware
  function middleware(req) {
    const userRole: string =
      typeof req.nextauth?.token?.role === "string"
        ? req.nextauth?.token?.role
        : "";
    if (
      (req.nextUrl.pathname.startsWith("/edition") ||
        req.nextUrl.pathname.startsWith("/feed")) &&
      !["EDITOR", "REVIEWER", "ADMIN"].includes(userRole)
    ) {
      return NextResponse.rewrite(new URL("/not-authorized", req.url));
    }
    if (
      req.nextUrl.pathname.startsWith("/explore") &&
      !["USER", "EDITOR", "REVIEWER", "ADMIN"].includes(userRole)
    ) {
      return NextResponse.rewrite(new URL("/not-authorized", req.url));
    }
  },
  // These are the options
  {
    callbacks: {
      authorized: ({ token }) => {
        // console.log(`[middleware auhtorized] token :`, token);
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ["/edition/:path*", "/explore/:path*"],
};
