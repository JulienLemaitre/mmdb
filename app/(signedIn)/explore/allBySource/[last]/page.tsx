import { db } from "@/utils/server/db";
import React from "react";
import getChartDataFromMMSources from "@/utils/getChartDataFromMMSources";
import AllBySourceList from "@/features/explore/AllBySourceList";
import {
  mMSourceInclude,
  tempoIndicationSelect,
} from "@/types/prismaSelections";
import { getTempoIndicationIdListFromPieceVersionList } from "@/features/pieceVersion/utils/getTempoIndicationIdListFromPieceVersionList";

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
    include: mMSourceInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  const tempoIndicationIdList = getTempoIndicationIdListFromPieceVersionList(
    mMSources.flatMap((mMSource) =>
      mMSource.pieceVersions.map((pvs) => pvs.pieceVersion),
    ),
  );

  const tempoIndicationList = await db.tempoIndication.findMany({
    where: {
      id: { in: tempoIndicationIdList },
    },
    select: tempoIndicationSelect,
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
    tempoIndicationList,
  };
};

export default async function Page(props: {
  params: Promise<{ last: string }>;
}) {
  const params = await props.params;

  const { last } = params;

  const { mMSources, tempoIndicationList } = await getData({ last });
  const chartData = getChartDataFromMMSources({
    mMSources,
    tempoIndicationList,
  });

  return (
    <AllBySourceList
      mMSources={mMSources}
      tempoIndicationList={tempoIndicationList}
      chartData={chartData}
      last={last}
    />
  );
}
