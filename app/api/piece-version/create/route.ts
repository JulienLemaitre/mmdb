import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import isReqAuthorized from "@/utils/isReqAuthorized";

export async function POST(req: NextRequest) {
  if (!isReqAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const body = await req.json();
  console.log(`[POST piece version] body :`, JSON.stringify(body));
  const { category, movements = [] } = body;

  const isPieceExisting = await db.piece.findUnique({
    where: {
      id: body.pieceId,
    },
  });
  console.log(
    `[piece-version POST] isPieceExisting`,
    JSON.stringify(isPieceExisting, null, 2),
  );
  if (!isPieceExisting) {
    NextResponse.json({ error: "Piece not found" }, { status: 404 });
  }
  const pieceVersion = await db.pieceVersion.create({
    data: {
      piece: {
        connect: {
          id: body.pieceId,
        },
      },
      category: category.value,
      movements: {
        create: movements.map((movement) => ({
          rank: movement.rank,
          key: movement.key.value,
          sections: {
            create: movement.sections.map((section) => ({
              rank: section.rank,
              metreNumerator: section.metreNumerator,
              metreDenominator: section.metreDenominator,
              isCommonTime: section.isCommonTime === "true",
              isCutTime: section.isCutTime === "true",
              fastestStructuralNotesPerBar:
                section.fastestStructuralNotesPerBar,
              fastestStaccatoNotesPerBar: section.fastestStaccatoNotesPerBar,
              fastestRepeatedNotesPerBar: section.fastestRepeatedNotesPerBar,
              fastestOrnamentalNotesPerBar:
                section.fastestOrnamentalNotesPerBar,
              ...(section.tempoIndication?.value
                ? {
                    tempoIndication: {
                      connect: {
                        id: section.tempoIndication.value,
                      },
                    },
                  }
                : {}),
              ...(section.comment
                ? {
                    comment: {
                      create: {
                        text: section.comment,
                      },
                    },
                  }
                : {}),
            })),
          },
        })),
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
              tempoIndication: {
                select: {
                  id: true,
                  text: true,
                },
              },
              comment: {
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
  });

  return NextResponse.json(pieceVersion);
}
