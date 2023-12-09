export { default } from "next-auth/middleware";
export const config = {
  matcher: ["/edition/:path*", "/explore/:path*"],
};
