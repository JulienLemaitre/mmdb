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
  const {
    startYear,
    endYear,
    tempoIndicationIds = [],
    composer,
  } = body as SearchFormInput;

  const mMSources = await db.mMSource.findMany({
    where: {
      pieceVersions: {
        some: {
          pieceVersion: {
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
                          },
                        },
                      },
                    },
                  },
                }
              : {}),
          },
        },
      },
    },
    include: {
      contributions: {
        include: {
          person: true,
          organization: true,
        },
      },
      references: true,
      pieceVersions: {
        include: {
          pieceVersion: {
            include: {
              piece: {
                include: {
                  collection: true,
                  composer: true,
                },
              },
              movements: {
                include: {
                  sections: {
                    include: {
                      tempoIndication: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      metronomeMarks: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const mMSourcesWithMMsMapped = mMSources.map((mMSource) => ({
    ...mMSource,
    pieceVersions: mMSource.pieceVersions.map((pvs) => ({
      ...pvs,
      pieceVersion: {
        ...pvs.pieceVersion,
        movements: pvs.pieceVersion.movements.map((mv) => ({
          ...mv,
          sections: mv.sections.map((section) => ({
            ...section,
            metronomeMarks: mMSource.metronomeMarks.filter(
              (mm) => mm.sectionId === section.id,
            ),
          })),
        })),
      },
    })),
  }));

  return NextResponse.json(mMSourcesWithMMsMapped);
}
