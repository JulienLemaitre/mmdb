// import { Piece, PieceVersion } from ".prisma/client";
import {
  Comment,
  Movement,
  Piece,
  PieceVersion,
  Section,
  TempoIndication,
} from "@prisma/client";

export type ComposerState = {
  id: string;
  firstName: string;
  lastName: string;
};

export type PieceState = Pick<
  Piece,
  "id" | "nickName" | "yearOfComposition" | "title"
>;

export type SectionState = Pick<
  Section,
  | "id"
  | "rank"
  | "metreNumerator"
  | "metreDenominator"
  | "isCommonTime"
  | "isCutTime"
> & {
  tempoIndication: Pick<TempoIndication, "text">;
  comment: Pick<Comment, "text">;
};

export type MovementState = Pick<Movement, "id" | "rank" | "key"> & {
  sections: SectionState[];
};

export type PieceVersionState = Pick<PieceVersion, "id" | "category"> & {
  movements: MovementState[];
};
