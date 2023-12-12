import { verifyJwt } from "@/utils/jwt";
import { NextRequest } from "next/server";
import { JwtPayload } from "jsonwebtoken";

export default async function getDecodedTokenFromReq(
  req: NextRequest,
): Promise<JwtPayload | null> {
  // Use of "Bearer token" authentication scheme
  const authHeader = req.headers.get("Authorization");
  const accessToken = authHeader && authHeader.split(" ")[1];
  return accessToken ? verifyJwt(accessToken) : null;
}
