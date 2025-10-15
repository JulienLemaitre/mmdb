import sendEmail from "@/utils/server/sendEmail";
import isReqAuthorized from "@/utils/server/isReqAuthorized";
import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  content: string;
  type: string;
}

const emailTypeList = ["FeedForm submit", "FeedForm ERROR", "FeedForm SUCCESS"];

export async function POST(request: NextRequest) {
  if (!isReqAuthorized(request)) {
    return NextResponse.json({ error: `Unauthorized` }, { status: 401 });
  }

  const body = (await request.json()) as RequestBody;
  const { type, ...content } = body || {};

  if (!type || !emailTypeList.includes(type)) {
    return new Response(JSON.stringify({ error: "Invalid email type" }), {});
  }

  return await sendEmail({ type, content })
    .then((res) => {
      console.log(`[api/sendEmail] res :`, res);
      return NextResponse.json(res);
    })
    .catch((err) => {
      console.error(`[api/sendEmail] err :`, err);
      return NextResponse.json(
        { error: `Failed to send email: ${err}` },
        { status: 500 },
      );
    });
}
