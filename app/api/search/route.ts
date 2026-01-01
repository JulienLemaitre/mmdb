import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/server/db";
import { SearchFormInput } from "@/types/formTypes";
import { hasMinimalRole } from "@/utils/server/hasMinimalRole";
import { userRole } from "@/utils/constants";
import {
  forbiddenResponse,
  unauthorizedResponse,
} from "@/utils/server/apiRouteResponse";
import { prodLog } from "@/utils/debugLogger";

export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await hasMinimalRole(userRole.EDITOR);

    if (!isAuthorized) {
      return forbiddenResponse();
    }
  } catch (_e) {
    return unauthorizedResponse();
  }

  const body = await req.json();
  prodLog.info(`[POST search] body :`, body);
  const {
    startYear,
    endYear,
    tempoIndicationIds = [],
    composer,
  } = body as SearchFormInput;
  const hasTempoIndicationIds = tempoIndicationIds.length > 0;

  const mMSources = await db.mMSource.findMany({
    where: {
      year: { gte: startYear, lte: endYear },
      ...((hasTempoIndicationIds || composer) && {
        pieceVersions: {
          some: {
            pieceVersion: {
              ...(composer
                ? { piece: { composer: { id: composer.value } } }
                : {}),
              ...(hasTempoIndicationIds
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
      }),
    },
    include: {
      contributions: {
        include: {
          person: true,
          organization: true,
        },
      },
      creator: true,
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
