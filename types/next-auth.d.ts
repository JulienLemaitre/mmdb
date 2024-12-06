import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string;
    accessToken: string;
  }
  interface Session {
    user: User & DefaultSession["user"];
    expires: string;
    error: string;
  }
}
