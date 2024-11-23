import { db } from "@/utils/db";
import GlobalShartByMMSources from "@/components/GlobalShartByMMSources";
import MMSourcesDetails from "@/components/MMSourcesDetails";

const dynamic = "force-dynamic";
const revalidate = 0;

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
    today.getDate() - lastNumber,
  );
  // const lastDateString = lastDate.toISOString().slice(0, 10);
  console.log(`[allBySource] getData lastDate :`, lastDate);
  // console.log(`[allBySource] getData lastDateString :`, lastDateString);

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

export default async function Page({
  params: { last },
}: {
  params: { last: string };
}) {
  const { mMSources } = await getData({ last });

  return (
    <main className="p-8">
      <div>{`Data created in the last ${last} day${Number(last) > 1 ? "s" : ""}.`}</div>
      <GlobalShartByMMSources mMSources={mMSources} />
      <MMSourcesDetails mMSources={mMSources} />
    </main>
  );
}
