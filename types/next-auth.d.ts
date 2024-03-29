import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: ?string;
      name?: string | null | undefined;
      email?: string;
      role?: string;
      accessToken?: string;
    };
  }
}
