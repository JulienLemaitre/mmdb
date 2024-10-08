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
                      metronomeMarks: true,
                    },
                  },
                },
              },
              // mMSources: {
              //   include: {
              //     mMSource: {
              //       include: {
              //         contributions: {
              //           include: {
              //             person: true,
              //             organization: true,
              //           },
              //         },
              //         references: true,
              //       },
              //     },
              //   },
              // },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return { mMSources };
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
