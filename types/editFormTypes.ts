import type {
  CONTRIBUTION_ROLE,
  MetronomeMark,
  Movement,
  Organization,
  Person,
  Piece,
  PieceVersion,
  Section,
  Source,
  TempoIndication,
} from "@prisma/client";

// Data in STATE

export type PersonState = {
  id: string;
  firstName: string;
  lastName: string;
};
export type ComposerState = PersonState;
export type OrganizationState = {
  id: string;
  name: string;
};
export type ContributionState =
  | {
      id: string;
      role: CONTRIBUTION_ROLE;
      person: PersonState;
    }
  | {
      id: string;
      role: CONTRIBUTION_ROLE;
      organization: OrganizationState;
    };
export type ContributionStateWithoutId =
  | {
      person: PersonState;
      role: CONTRIBUTION_ROLE;
    }
  | {
      organization: OrganizationState;
      role: CONTRIBUTION_ROLE;
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
  | "comment"
> & {
  tempoIndication: Pick<TempoIndication, "text"> | null;
};

export type MovementState = Pick<Movement, "id" | "rank" | "key"> & {
  sections: SectionState[];
};

export type PieceVersionState = Pick<PieceVersion, "id" | "category"> & {
  movements: MovementState[];
};

export type SourceState = Pick<
  Source,
  "id" | "title" | "type" | "link" | "year" | "references" | "comment"
>;

// Form INPUTS

export type OptionInput = {
  value: string;
  label: string;
};

export type PersonInput = Pick<
  Person,
  "firstName" | "lastName" | "birthYear" | "deathYear"
>;
export type ComposerInput = PersonInput;
export type PieceInput = Pick<
  Piece,
  "nickname" | "yearOfComposition" | "title"
>;
export type SectionInput = Pick<
  Section,
  | "rank"
  | "metreNumerator"
  | "metreDenominator"
  // | "isCommonTime"
  // | "isCutTime"
  | "fastestStructuralNotesPerBar"
  | "fastestStaccatoNotesPerBar"
  | "fastestRepeatedNotesPerBar"
  | "fastestOrnamentalNotesPerBar"
  // | "isFastestStructuralNoteBelCanto"
  | "comment"
> & {
  tempoIndication?: string;
  isCommonTime?: boolean;
  isCutTime?: boolean;
  isFastestStructuralNoteBelCanto?: string;
};
export type MovementInput = Pick<Movement, "rank"> & {
  key: OptionInput;
  sections: SectionInput[];
};
export type PieceVersionInput = {
  category: OptionInput;
  movements: MovementInput[];
};

export type SourceInput = Pick<
  Source,
  "id" | "title" | "type" | "link" | "year" | "references" | "comment"
>;

export type ContributionInput = {
  role: OptionInput;
} & (
  | {
      person: PersonInput;
    }
  | {
      organization: Pick<Organization, "id" | "name">;
    }
);

export type MetronomeMarksInput = Pick<
  MetronomeMark,
  "sectionId" | "bpm" | "comment"
> & {
  beatUnit: OptionInput;
};
