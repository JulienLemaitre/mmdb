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

export type StateEntity = {
  rank: number;
  name: string;
  displayName: string;
  segment: string;
  path: string;
};

export type isNewProp = {
  isNew?: boolean;
};
export type PersonState = {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  deathYear: number | null;
};
export type ComposerState = PersonState & isNewProp;
export type OrganizationState = {
  id: string;
  name: string;
};
export type ContributionState =
  | ({
      id: string;
      role: CONTRIBUTION_ROLE;
      person: PersonState;
    } & isNewProp)
  | ({
      id: string;
      role: CONTRIBUTION_ROLE;
      organization: OrganizationState;
    } & isNewProp);
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
> &
  isNewProp;

export type SectionState = Pick<
  Section,
  | "id"
  | "rank"
  | "metreNumerator"
  | "metreDenominator"
  | "isCommonTime"
  | "isCutTime"
  | "comment"
  | "fastestStructuralNotesPerBar"
  | "fastestStaccatoNotesPerBar"
  | "fastestRepeatedNotesPerBar"
  | "fastestOrnamentalNotesPerBar"
> & {
  tempoIndication: Pick<TempoIndication, "text"> | null;
};

export type MovementState = Pick<Movement, "id" | "rank" | "key"> & {
  sections: SectionState[];
};

export type PieceVersionState = Pick<PieceVersion, "id" | "category"> & {
  movements: MovementState[];
} & isNewProp;

export type SourceState = Pick<
  Source,
  "id" | "title" | "type" | "link" | "year" | "references" | "comment"
> &
  isNewProp;

export type MetronomeMarkState = Pick<
  MetronomeMark,
  "id" | "sectionId" | "bpm" | "comment" | "beatUnit" | "sourceId"
>;

// Form INPUTS

export type OptionInput = {
  value: string;
  label: string;
};

export type PersonInput = Pick<
  Person,
  "firstName" | "lastName" | "birthYear" | "deathYear"
> & { id?: string };
export type PieceInput = Pick<
  Piece,
  "nickname" | "yearOfComposition" | "title"
> & { id?: string };
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
  tempoIndication: OptionInput;
  isCommonTime?: boolean;
  isCutTime?: boolean;
  isFastestStructuralNoteBelCanto?: boolean;
};
export type MovementInput = Pick<Movement, "rank"> & {
  key: OptionInput;
  sections: SectionInput[];
};
export type PieceVersionInput = {
  id?: string;
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
