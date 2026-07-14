// src/types/prismaSelections.ts
import { Prisma } from "@/prisma/client";

export const pieceVersionSelect = {
  id: true,
  category: true,
  pieceId: true,
  movements: {
    select: {
      id: true,
      rank: true,
      key: true,
      sections: {
        select: {
          id: true,
          rank: true,
          metreNumerator: true,
          metreDenominator: true,
          isCommonTime: true,
          isCutTime: true,
          tempoIndicationId: true,
          comment: true,
          fastestBelCantoNotesPerBar: true,
          fastestStructuralNotesPerBar: true,
          fastestStaccatoNotesPerBar: true,
          fastestRepeatedNotesPerBar: true,
          fastestOrnamentalNotesPerBar: true,
        },
        orderBy: {
          rank: "asc",
        },
      },
    },
    orderBy: {
      rank: "asc",
    },
  },
} satisfies Prisma.PieceVersionSelect;

export type PieceVersion = Prisma.PieceVersionGetPayload<{
  select: typeof pieceVersionSelect;
}>;

export const tempoIndicationSelect = {
  id: true,
  text: true,
} satisfies Prisma.TempoIndicationSelect;

export type TempoIndication = Prisma.TempoIndicationGetPayload<{
  select: typeof tempoIndicationSelect;
}>;

export const mMSourceInclude = {
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
              sections: true,
            },
          },
        },
      },
    },
  },
  metronomeMarks: true,
} satisfies Prisma.MMSourceInclude;

export type MMSourceRecord = Prisma.MMSourceGetPayload<{
  include: typeof mMSourceInclude;
}>;
