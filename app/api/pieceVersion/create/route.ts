import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/server/db";
import isReqAuthorized from "@/utils/server/isReqAuthorized";
import getDecodedTokenFromReq from "@/utils/server/getDecodedTokenFromReq";

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
      creator: {
        connect: {
          id: creatorId,
        },
      },
      movements: {
        create: movements
          .sort((a, b) => a.rank - b.rank)
          .map((movement) => ({
            rank: movement.rank,
            key: movement.key.value,
            sections: {
              create: movement.sections
                .sort((a, b) => a.rank - b.rank)
                .map((section) => ({
                  rank: section.rank,
                  metreNumerator: section.metreNumerator,
                  metreDenominator: section.metreDenominator,
                  isCommonTime: section.isCommonTime,
                  isCutTime: section.isCutTime,
                  fastestStructuralNotesPerBar:
                    section.fastestStructuralNotesPerBar,
                  fastestStaccatoNotesPerBar:
                    section.fastestStaccatoNotesPerBar,
                  fastestRepeatedNotesPerBar:
                    section.fastestRepeatedNotesPerBar,
                  fastestOrnamentalNotesPerBar:
                    section.fastestOrnamentalNotesPerBar,
                  isFastestStructuralNoteBelCanto:
                    section.isFastestStructuralNoteBelCanto,
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
                        comment: section.comment,
                      }
                    : {}),
                  ...(section.commentForReview
                    ? {
                        commentForReview: section.commentForReview,
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
              comment: true,
              commentForReview: true,
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
  });

  return NextResponse.json(pieceVersion);
}
