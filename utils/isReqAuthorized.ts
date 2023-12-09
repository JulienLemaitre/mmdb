import { verifyJwt } from "@/utils/jwt";
import { NextRequest } from "next/server";

export default function isReqAuthorized(req: NextRequest) {
  const accessToken = req.headers.get("authorization");
  return accessToken && verifyJwt(accessToken);
}
