import { db } from "@/utils/server/db";
import isReqAuthorized from "@/utils/server/isReqAuthorized";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
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
