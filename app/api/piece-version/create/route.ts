import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log(`[POST piece version] body :`, body);
  const { category, movements = {} } = body;

  const piece = await db.pieceVersion.create({
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
              ...(section.tempoIndication?.value || section.tempoIndication
                ? {
                    tempoIndication: {
                      connectOrCreate: {
                        text:
                          section.tempoIndication.value ||
                          section.tempoIndication,
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
    // composer: {
    //   connect: {
    //     id: composerId,
    //   },
    // },
  });

  return NextResponse.json(piece);
}
