import { MetronomeMark } from "@/prisma/client";
import { MMSourceRecord, TempoIndication } from "@/types/prismaSelections";

// Type enrichi avec les metronomeMarks injectés dans chaque section
type MMSourceSection =
  MMSourceRecord["pieceVersions"][number]["pieceVersion"]["movements"][number]["sections"][number];

type MMSourceSectionWithMetronomeMarks = MMSourceSection & {
  metronomeMarks: MetronomeMark[];
};

type MMSourceMovement =
  MMSourceRecord["pieceVersions"][number]["pieceVersion"]["movements"][number];

type MMSourceMovementWithMetronomeMarks = Omit<MMSourceMovement, "sections"> & {
  sections: MMSourceSectionWithMetronomeMarks[];
};

type MMSourcePieceVersion =
  MMSourceRecord["pieceVersions"][number]["pieceVersion"];

type MMSourcePieceVersionWithMetronomeMarks = Omit<
  MMSourcePieceVersion,
  "movements"
> & {
  movements: MMSourceMovementWithMetronomeMarks[];
};

export type MMSourceFull = Omit<MMSourceRecord, "pieceVersions"> & {
  pieceVersions: Array<
    Omit<MMSourceRecord["pieceVersions"][number], "pieceVersion"> & {
      pieceVersion: MMSourcePieceVersionWithMetronomeMarks;
    }
  >;
};

export type MMSourceSearchResult = {
  mMSources: MMSourceFull[];
  tempoIndicationList: TempoIndication[];
};
