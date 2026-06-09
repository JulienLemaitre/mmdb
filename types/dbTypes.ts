import { Prisma } from "@/prisma/client";

// mMsource enriched for Explore interface
export const mMSourceExploreInclude = {
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
              collection: {
                select: {
                  id: true,
                  title: true,
                  composerId: true,
                  _count: {
                    select: {
                      pieces: true,
                    },
                  },
                },
              },
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
} satisfies Prisma.MMSourceInclude; // Utilise satisfies pour vérifier la validité du type

// Génération du type pour le résultat de la requête
export type MMSourceWithDetailsForExplore = Prisma.MMSourceGetPayload<{
  include: typeof mMSourceExploreInclude;
}>;
