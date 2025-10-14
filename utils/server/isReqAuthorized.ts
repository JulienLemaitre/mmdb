import { verifyJwt } from "@/utils/server/jwt";
import { NextRequest } from "next/server";

export default function isReqAuthorized(req: NextRequest) {
  // Use of "Bearer token" authentication scheme
  const authHeader = req.headers.get("Authorization");
  const accessToken = authHeader && authHeader.split(" ")[1];
  console.log(`[isReqAuthorized] accessToken :`, accessToken);
  return accessToken && verifyJwt(accessToken);
}
