import { db } from "@/utils/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";
import { REFERENCE_TYPE } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as REFERENCE_TYPE;
  const reference = searchParams.get("reference");
  if (!type || !reference)
    return new Response(
      JSON.stringify({ error: "type and reference should be provided" }),
      {
        status: 400,
      },
    );
  const referenceResult = await db.reference.findUnique({
    where: {
      type_reference: {
        type: type,
        reference: reference,
      },
    },
    select: {
      id: true,
      // mMSource: {
      //   select: {
      //     id: true,
      //     title: true,
      //     type: true,
      //     link: true,
      //     year: true,
      //     comment: true,
      //     contributions: true,
      //     pieceVersions: {
      //       select: {
      //         pieceVersion: {
      //           select: {
      //             piece: true,
      //           },
      //         },
      //       },
      //     },
      //   },
      // },
    },
  });
  const finalReference = referenceResult
    ? deleteNullPropertiesFromObject(referenceResult) // We ensure properties will not be initiated with null values
    : null;

  return Response.json(finalReference);
}
