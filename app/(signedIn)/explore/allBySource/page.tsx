import { db } from "@/utils/db";
import GlobalShartByMMSources from "@/components/GlobalShartByMMSources";
import MMSourcesDetails from "@/components/MMSourcesDetails";

const getData = async () => {
  const mMSources = await db.mMSource.findMany({
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

export default async function Page() {
  const { mMSources } = await getData();

  return (
    <main className="p-8">
      <div className="w-full h-[800px] text-slate-900 dark:text-white">
        <GlobalShartByMMSources mMSources={mMSources} />
      </div>
      <MMSourcesDetails mMSources={mMSources} />
    </main>
  );
}
