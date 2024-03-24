import type {
  CONTRIBUTION_ROLE,
  MetronomeMark,
  Movement,
  Organization,
  Person,
  Piece,
  PieceVersion,
  Reference,
  Section,
  MMSource,
  TempoIndication,
} from "@prisma/client";

// Sub-Types

export type ReferenceTypeAndReference = Pick<Reference, "type" | "reference">;

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
  | "isFastestStructuralNoteBelCanto"
> & {
  tempoIndication: Pick<TempoIndication, "text">;
};

export type MovementState = Pick<Movement, "id" | "rank" | "key"> & {
  sections: SectionState[];
};

export type PieceVersionState = Pick<PieceVersion, "id" | "category"> & {
  movements: MovementState[];
} & isNewProp;

export type ReferenceState = Pick<Reference, "type" | "reference">;
export type SourceDescriptionState = Pick<
  MMSource,
  "title" | "type" | "link" | "year" | "comment"
> & {
  id?: string;
  references: ReferenceState[];
  pieceVersions?: Pick<PieceVersionState, "id">[];
} & isNewProp;

export type MetronomeMarkState = Pick<
  MetronomeMark,
  "id" | "sectionId" | "bpm" | "comment" | "beatUnit" | "mMSourceId"
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
  | "isCommonTime"
  | "isCutTime"
  | "fastestStructuralNotesPerBar"
  | "fastestStaccatoNotesPerBar"
  | "fastestRepeatedNotesPerBar"
  | "fastestOrnamentalNotesPerBar"
  | "isFastestStructuralNoteBelCanto"
  | "comment"
> & {
  tempoIndication: OptionInput;
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
export type ReferenceInput = {
  type: OptionInput;
  reference: string;
};

export type SourceDescriptionInput = Pick<MMSource, "link" | "year"> & {
  id?: string;
  comment?: string;
  title?: string;
  references?: ReferenceInput[];
  type: OptionInput;
};

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
