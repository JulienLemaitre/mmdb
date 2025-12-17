import { db } from "@/utils/server/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";
import { REFERENCE_TYPE } from "@/prisma/client/enums";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const plateNumber = searchParams.get("plateNumber");
  if (!plateNumber)
    return new Response(JSON.stringify({ error: "No plateNumber provided" }), {
      status: 400,
    });
  const mMSourceResultList = await db.mMSource.findMany({
    where: {
      references: {
        some: {
          type: REFERENCE_TYPE.PLATE_NUMBER,
          reference: plateNumber,
        },
      },
    },
    select: {
      id: true,
      title: true,
      type: true,
      link: true,
      year: true,
      comment: true,
      references: {
        select: {
          type: true,
          reference: true,
        },
      },
    },
  });
  const mMSourceList =
    mMSourceResultList && mMSourceResultList.length > 0
      ? mMSourceResultList.map((mMSource) =>
          deleteNullPropertiesFromObject(mMSource),
        ) // We ensure properties will not be initiated with null values
      : null;

  return Response.json(mMSourceList);
}
