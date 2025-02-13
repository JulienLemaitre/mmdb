import { NextRequest } from "next/server";

export default function getAccessTokenFromReq(
  req: NextRequest,
): string | undefined {
  // Use of "Bearer token" authentication scheme
  const authHeader = req.headers.get("Authorization");
  return authHeader ? authHeader.split(" ")[1] : undefined;
}
