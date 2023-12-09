import { db } from "@/utils/db";
import isReqAuthorized from "@/utils/isReqAuthorized";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!isReqAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const userInfos = await db.user.findFirst({
    where: { id: params.id },
  });
  return new Response(JSON.stringify(userInfos));
}
