import { MetronomeMark } from "@/prisma/client";
import { MMSourceRecord, TempoIndication } from "@/types/prismaSelections";

// Type enrichi avec les metronomeMarks injectés dans chaque section
export type MMSourceFull = Omit<MMSourceRecord, "pieceVersions"> & {
  pieceVersions: Array<
    Omit<MMSourceRecord["pieceVersions"][number], "pieceVersion"> & {
      pieceVersion: Omit<
        MMSourceRecord["pieceVersions"][number]["pieceVersion"],
        "movements"
      > & {
        movements: Array<
          Omit<
            MMSourceRecord["pieceVersions"][number]["pieceVersion"]["movements"][number],
            "sections"
          > & {
            sections: Array<
              MMSourceRecord["pieceVersions"][number]["pieceVersion"]["movements"][number]["sections"][number] & {
                metronomeMarks: MetronomeMark[];
              }
            >;
          }
        >;
      };
    }
  >;
};

export type MMSourceSearchResult = {
  mMSources: MMSourceFull[];
  tempoIndicationList: TempoIndication[];
};
