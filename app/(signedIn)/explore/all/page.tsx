import { db } from "@/utils/db";
import ComposersPiecesDetails from "@/components/ComposersPiecesDetails";
import GlobalShartByPersons from "@/components/GlobalShartByPersons";

const getData = async () => {
  const persons = await db.person.findMany({
    include: {
      compositions: {
        include: {
          collection: true,
          pieceVersions: {
            include: {
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
          },
        },
      },
    },
    orderBy: {
      birthYear: "asc",
    },
  });
  return { persons };
};

export default async function Page() {
  const { persons } = await getData();

  return (
    <main className="p-8">
      <div className="w-full h-[800px] text-slate-900 dark:text-white">
        <GlobalShartByPersons persons={persons} />
      </div>
      <ComposersPiecesDetails persons={persons} />
    </main>
  );
}
