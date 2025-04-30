import { db } from "@/utils/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url)
    return new Response(JSON.stringify({ error: "url must be provided" }), {
      status: 400,
    });
  const mMSourceResult = await db.mMSource.findFirst({
    where: {
      link: url,
    },
    select: {
      id: true,
    },
  });
  const finalMMSource = mMSourceResult
    ? deleteNullPropertiesFromObject(mMSourceResult) // We ensure properties will not be initiated with null values
    : null;

  return Response.json(finalMMSource);
}
