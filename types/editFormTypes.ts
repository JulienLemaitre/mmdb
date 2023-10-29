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
export type SelectInput = {
  label: string;
  value: string;
};
export type PieceInput = Pick<
  Piece,
  "nickname" | "yearOfComposition" | "title"
>;
export type SectionInput = Pick<
  Section,
  | "rank"
  | "metreNumerator"
  | "metreDenominator"
  | "isCommonTime"
  | "isCutTime"
  | "fastestStructuralNotesPerBar"
  | "fastestStaccatoNotesPerBar"
  | "fastestRepeatedNotesPerBar"
  | "fastestOrnamentalNotesPerBar"
  | "isFastestStructuralNoteBelCanto"
> & { tempoIndication?: string; comment?: string };
export type MovementInput = Pick<Movement, "rank"> & {
  key: SelectInput;
  sections: SectionInput[];
};
export type PieceVersionInput = {
  category: SelectInput;
  movements: MovementInput[];
};

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
