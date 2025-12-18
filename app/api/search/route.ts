import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/server/db";
// import isReqAuthorized from "@/utils/isReqAuthorized";
import { SearchFormInput } from "@/types/formTypes";
// import getDecodedTokenFromReq from "@/utils/getDecodedTokenFromReq";
// import { OptionInput } from "@/types/formTypes";

export async function POST(req: NextRequest) {
  // if (!isReqAuthorized(req)) {
  //   return new Response(JSON.stringify({ error: "Unauthorized" }), {
  //     status: 401,
  //   });
  // }

  // const decodedToken = await getDecodedTokenFromReq(req);
  // const creatorId = decodedToken?.id;
  // if (!creatorId) {
  //   return new Response(JSON.stringify({ error: "Unauthorized creator" }), {
  //     status: 401,
  //   });
  // }

  const body = await req.json();
  console.log(`[POST search] body :`, body);
  const { startYear, endYear, tempoIndicationIds, composer } =
    body as SearchFormInput;

  const pieceVersions = await db.pieceVersion.findMany({
    where: {
      piece: {
        yearOfComposition: { gte: startYear, lte: endYear },
        ...(composer ? { composer: { id: composer.value } } : {}),
      },
      ...(tempoIndicationIds.length > 0
        ? {
            movements: {
              some: {
                sections: {
                  some: {
                    tempoIndication: {
                      id: {
                        in: tempoIndicationIds,
                      },
                      // text: {
                      //   contains: "Allegro",
                      //   // contains: tempoIndication.label,
                      // },
                    },
                  },
                },
              },
            },
          }
        : {}),
    },
    include: {
      piece: {
        include: {
          composer: true,
          collection: true,
        },
      },
      movements: {
        include: {
          sections: {
            include: {
              tempoIndication: true,
              metronomeMarks: {
                include: {
                  mMSource: {
                    include: {
                      contributions: {
                        include: {
                          person: true,
                          organization: true,
                        },
                      },
                      references: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      mMSources: {
        include: {
          mMSource: {
            include: {
              contributions: {
                include: {
                  person: true,
                  organization: true,
                },
              },
              references: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(pieceVersions);
}
