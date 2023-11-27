import {
  Comment,
  CONTRIBUTION_ROLE,
  Movement,
  Organization,
  Person,
  Piece,
  PieceVersion,
  Section,
  Source,
  TempoIndication,
} from "@prisma/client";

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
export type PersonInput = Pick<
  Person,
  "firstName" | "lastName" | "birthYear" | "deathYear"
>;
export type ComposerInput = PersonInput;
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
  // | "isCommonTime"
  // | "isCutTime"
  | "fastestStructuralNotesPerBar"
  | "fastestStaccatoNotesPerBar"
  | "fastestRepeatedNotesPerBar"
  | "fastestOrnamentalNotesPerBar"
  // | "isFastestStructuralNoteBelCanto"
> & {
  tempoIndication?: string;
  comment?: string;
  isCommonTime?: string;
  isCutTime?: string;
  isFastestStructuralNoteBelCanto?: string;
};
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
  tempoIndication: Pick<TempoIndication, "text"> | null;
  comment: Pick<Comment, "text"> | null;
};

export type MovementState = Pick<Movement, "id" | "rank" | "key"> & {
  sections: SectionState[];
};

export type PieceVersionState = Pick<PieceVersion, "id" | "category"> & {
  movements: MovementState[];
};

export type SourceDescriptionState = Pick<
  Source,
  "id" | "title" | "type" | "link" | "year" | "references"
> & {
  comment: Pick<Comment, "text"> | null;
};

export type SourceDescriptionInput = Pick<
  Source,
  "id" | "title" | "type" | "link" | "year" | "references"
> & {
  comment: Pick<Comment, "text"> | null;
};

export type ContributionInput = {
  role: Option;
} & (
  | {
      person: PersonInput;
    }
  | {
      organization: Pick<Organization, "id" | "name">;
    }
);
export type SourceContributionInput = Pick<Source, "id"> & {
  contributions: ContributionInput[];
};
export type Option = {
  value: string;
  label: string;
};
