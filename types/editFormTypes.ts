// import { Piece, PieceVersion } from ".prisma/client";
import {
  Comment,
  Movement,
  Person,
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
export type ComposerInput = Pick<
  Person,
  "firstName" | "lastName" | "birthYear" | "deathYear"
>;
export type CategoryInput = {
  label: string;
  value: string;
};
export type PieceInput = Pick<
  Piece,
  "nickname" | "yearOfComposition" | "title"
> & { category: CategoryInput };

export type PieceState = Pick<
  Piece,
  "id" | "nickname" | "yearOfComposition" | "title"
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
  tempoIndication?: Pick<TempoIndication, "text">;
  comment?: Pick<Comment, "text">;
};

export type MovementState = Pick<Movement, "id" | "rank" | "key"> & {
  sections: SectionState[];
};

export type PieceVersionState = Pick<PieceVersion, "id" | "category"> & {
  movements: MovementState[];
};
