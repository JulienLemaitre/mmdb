import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import isReqAuthorized from "@/utils/isReqAuthorized";
import getDecodedTokenFromReq from "@/utils/getDecodedTokenFromReq";
import { Movement, PieceVersion, PrismaPromise, Section } from "@prisma/client";

export async function POST(req: NextRequest) {
  if (!isReqAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const decodedToken = await getDecodedTokenFromReq(req);
  const creatorId = decodedToken?.id;
  if (!creatorId) {
    return new Response(JSON.stringify({ error: "Unauthorized creator" }), {
      status: 401,
    });
  }

  const body = await req.json();
  console.log(`[UPDATE piece version] body :`, JSON.stringify(body));
  const { category, id: pieceVersionId, movements = [] } = body;

  type SelectedPieceVersion = Pick<PieceVersion, "id" | "category"> & {
    movements: Omit<Movement, "createdAt" | "updatedAt" | "pieceVersionId">[];
  };
  type Operation = Section | Movement | SelectedPieceVersion;
  const operations: PrismaPromise<Operation>[] = [];

  // First, handle the movements
  for (const movement of movements) {
    const upsertMovement = {
      id: movement.id || uuidv4(), // Generate a unique ID for new movements
      rank: movement.rank,
      key: movement.key.value,
      pieceVersion: { connect: { id: pieceVersionId } },
    };
    // // Generate a unique ID for new movements
    // if (!movement.id) {
    //   movement.id = uuidv4();
    // }

    // Upsert each movement
    operations.push(
      db.movement.upsert({
        where: { id: movement.id },
        create: upsertMovement,
        update: upsertMovement,
      }),
    );
  }

  // Then, handle the sections
  for (const movement of movements) {
    for (const section of movement.sections) {
      const upsertedSection = {
        movement: { connect: { id: movement.id } },
        rank: section.rank,
        metreNumerator: section.metreNumerator,
        metreDenominator: section.metreDenominator,
        isCommonTime: section.isCommonTime,
        isCutTime: section.isCutTime,
        fastestStructuralNotesPerBar: section.fastestStructuralNotesPerBar,
        fastestStaccatoNotesPerBar: section.fastestStaccatoNotesPerBar,
        fastestRepeatedNotesPerBar: section.fastestRepeatedNotesPerBar,
        fastestOrnamentalNotesPerBar: section.fastestOrnamentalNotesPerBar,
        isFastestStructuralNoteBelCanto:
          section.isFastestStructuralNoteBelCanto,
        tempoIndication: {
          connect: {
            id: section.tempoIndication.value,
          },
        },
        ...(section.comment
          ? {
              comment: section.comment,
            }
          : {}),
      };
      // Upsert each section
      operations.push(
        db.section.upsert({
          where: { id: section.id },
          create: upsertedSection,
          update: upsertedSection,
        }),
      );
    }
  }

  // Finally, update the pieceVersion
  operations.push(
    db.pieceVersion.update({
      where: { id: pieceVersionId },
      data: {
        piece: { connect: { id: body.pieceId } },
        category: category.value,
        // creator: { connect: { id: creatorId } },
        movements: {
          connect: movements.map((movement) => ({ id: movement.id })),
        },
      },
      select: {
        id: true,
        category: true,
        movements: {
          select: {
            id: true,
            rank: true,
            key: true,
            sections: {
              select: {
                id: true,
                rank: true,
                metreNumerator: true,
                metreDenominator: true,
                isCommonTime: true,
                isCutTime: true,
                fastestStructuralNotesPerBar: true,
                fastestStaccatoNotesPerBar: true,
                fastestRepeatedNotesPerBar: true,
                fastestOrnamentalNotesPerBar: true,
                isFastestStructuralNoteBelCanto: true,
                comment: true,
                tempoIndication: {
                  select: {
                    id: true,
                    text: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  );

  // Execute all operations in a single transaction
  const results = await db.$transaction(operations);

  // The last result is the updated pieceVersion with the selected values
  const pieceVersion = results[results.length - 1];

  return NextResponse.json(pieceVersion);
  // const pieceVersion = await db.pieceVersion.update({
  //   where: {
  //     id,
  //   },
  //   data: {
  //     piece: {
  //       connect: {
  //         id: body.pieceId,
  //       },
  //     },
  //     category: category.value,
  //     creator: {
  //       connect: {
  //         id: creatorId,
  //       },
  //     },
  //     movements: {
  //       upsert: movements
  //         .sort((a, b) => a.rank - b.rank)
  //         .map((movement) => {
  //           const upsertMovement = {
  //             rank: movement.rank,
  //             key: movement.key.value,
  //             sections: {
  //               upsert: movement.sections
  //                 .sort((a, b) => a.rank - b.rank)
  //                 .map((section) => {
  //                   const upsertSection = {
  //                     rank: section.rank,
  //                     metreNumerator: section.metreNumerator,
  //                     metreDenominator: section.metreDenominator,
  //                     isCommonTime: section.isCommonTime,
  //                     isCutTime: section.isCutTime,
  //                     fastestStructuralNotesPerBar:
  //                       section.fastestStructuralNotesPerBar,
  //                     fastestStaccatoNotesPerBar:
  //                       section.fastestStaccatoNotesPerBar,
  //                     fastestRepeatedNotesPerBar:
  //                       section.fastestRepeatedNotesPerBar,
  //                     fastestOrnamentalNotesPerBar:
  //                       section.fastestOrnamentalNotesPerBar,
  //                     isFastestStructuralNoteBelCanto:
  //                       section.isFastestStructuralNoteBelCanto,
  //                     ...(section.tempoIndication?.value
  //                       ? {
  //                           tempoIndication: {
  //                             connect: {
  //                               id: section.tempoIndication.value,
  //                             },
  //                           },
  //                         }
  //                       : {}),
  //                     ...(section.comment
  //                       ? {
  //                           comment: section.comment,
  //                         }
  //                       : {}),
  //                   };
  //                   return {
  //                     where: {
  //                       id: section.id,
  //                     },
  //                     create: upsertSection,
  //                     update: upsertSection,
  //                   };
  //                 }),
  //             },
  //           };
  //
  //           return {
  //             where: {
  //               id: movement.id,
  //             },
  //             create: upsertMovement,
  //             update: upsertMovement,
  //           };
  //         }),
  //     },
  //   },
  //   select: {
  //     id: true,
  //     category: true,
  //     movements: {
  //       select: {
  //         id: true,
  //         rank: true,
  //         key: true,
  //         sections: {
  //           select: {
  //             id: true,
  //             rank: true,
  //             metreNumerator: true,
  //             metreDenominator: true,
  //             isCommonTime: true,
  //             isCutTime: true,
  //             fastestStructuralNotesPerBar: true,
  //             fastestStaccatoNotesPerBar: true,
  //             fastestRepeatedNotesPerBar: true,
  //             fastestOrnamentalNotesPerBar: true,
  //             isFastestStructuralNoteBelCanto: true,
  //             comment: true,
  //             tempoIndication: {
  //               select: {
  //                 id: true,
  //                 text: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  // });
  //
  // return NextResponse.json(pieceVersion);
}
