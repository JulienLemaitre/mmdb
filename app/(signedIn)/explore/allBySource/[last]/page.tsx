import { db } from "@/utils/server/db";
import React from "react";
import getChartDataFromMMSources from "@/utils/getChartDataFromMMSources";
import AllBySourceList from "@/features/explore/AllBySourceList";

const MAX_LAST_NB_DAYS = 90;

// TODO remove these lines if it updates properly when a new piece is registered, without them.
// const dynamic = "force-dynamic";
// const revalidate = 0;

const getData = async ({ last }) => {
  // compute a number from string last argument
  let lastNumber = parseInt(last, 10);

  // If last is not a valid number, set it to 0
  if (isNaN(lastNumber) || lastNumber <= 0) {
    lastNumber = 0;
  }
  // Take today date, compute a date {last} days before in format YYYY-MM-DD
  const today = new Date();
  const lastDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - Math.min(MAX_LAST_NB_DAYS, lastNumber),
  );

  const mMSources = await db.mMSource.findMany({
    where: {
      createdAt: { gte: lastDate },
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

  // Get each section metronomeMark from the source's ones only
  return {
    mMSources: mMSources.map((mMSource) => ({
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
    })),
  };
};

export default async function Page(props: {
  params: Promise<{ last: string }>;
}) {
  const params = await props.params;

  const { last } = params;

  const { mMSources } = await getData({ last });
  const chartData = getChartDataFromMMSources({ mMSources });

  return (
    <AllBySourceList mMSources={mMSources} chartData={chartData} last={last} />
  );
}
