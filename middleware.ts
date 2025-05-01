import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // This is the middleware
  function middleware(req) {
    const userRole: string =
      typeof req.nextauth?.token?.role === "string"
        ? req.nextauth?.token?.role
        : "";

    const accessToken = req.nextauth?.token?.accessToken as string;

    // we'll get the expiration time of the access token
    const decodedAccessToken =
      accessToken &&
      JSON.parse(Buffer.from(accessToken.split(".")[1], "base64").toString());
    // console.log(`[Auth middleware] decodedAccessToken :`, decodedAccessToken);

    const accessTokenExpires: number =
      decodedAccessToken && decodedAccessToken["exp"] * 1000;

    const hasValidToken = !!(
      accessTokenExpires && Date.now() < Number(accessTokenExpires)
    );
    // console.log(
    //   `[Auth middleware] isAuthorizedForPrivateRoutes :`,
    //   hasValidToken,
    // );

    if (req.nextUrl.pathname.startsWith("/feed")) {
      if (!hasValidToken) {
        return NextResponse.rewrite(new URL("/logout", req.url));
      }
      if (!["EDITOR", "REVIEWER", "ADMIN"].includes(userRole)) {
        return NextResponse.rewrite(new URL("/not-authorized", req.url));
      }
    }
    if (req.nextUrl.pathname.startsWith("/explore")) {
      if (!hasValidToken) {
        return NextResponse.rewrite(new URL("/logout", req.url));
      }
      if (!["USER", "EDITOR", "REVIEWER", "ADMIN"].includes(userRole)) {
        return NextResponse.rewrite(new URL("/not-authorized", req.url));
      }
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
  matcher: ["/feed/:path*", "/explore/:path*"],
};
