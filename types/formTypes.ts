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
  MMSourcesOnPieceVersions,
} from "@prisma/client";
import { FeedFormState } from "@/components/context/feedFormContext";
import { FC } from "react";
import { SourceOnPieceVersionsFormState } from "@/components/context/SourceOnPieceVersionFormContext";

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
export type FeedFormStep = {
  rank: number;
  id: string;
  actionTypes: string[];
  title: string;
  isComplete: (state: FeedFormState) => boolean;
  Component?: FC;
};
export type SourceOnPieceVersionsFormStep = {
  id: string;
  title: string;
  rank: number;
  isComplete: (state: SourceOnPieceVersionsFormState) => boolean;
  Component?: FC<{ onFormClose: () => void }>;
  actionTypes: string[];
};
export type IsNewProp = {
  isNew?: boolean;
};
export type GoNextProp = {
  next?: boolean;
};
export type PersonState = {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  deathYear: number | null;
} & IsNewProp;
// export type PersonState = PersonState & IsNewProp;
// export type NewPersonState = PersonState & { isNew: true };
export type OrganizationState = {
  id: string;
  name: string;
};
export type ContributionState =
  | ({
      id?: string;
      role: CONTRIBUTION_ROLE;
      person: PersonState;
    } & IsNewProp)
  | ({
      id?: string;
      role: CONTRIBUTION_ROLE;
      organization: OrganizationState;
    } & IsNewProp);

export type MMSourceContributionsState = ContributionState[];

export type ContributionStateWithoutId =
  | {
      person: PersonState;
      role: CONTRIBUTION_ROLE;
    }
  | {
      organization: OrganizationState;
      role: CONTRIBUTION_ROLE;
    };

// export type SourceOnPieceVersionState = {
//   sourceId: string;
//   pieceVersionId: string;
//   rank: number;
// };

export type PieceState = Pick<
  Piece,
  "id" | "nickname" | "yearOfComposition" | "title" | "composerId"
> &
  IsNewProp;

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
} & IsNewProp;
export type NewPieceVersionState = PieceVersionState & { isNew: true };

export type ReferenceState = Pick<Reference, "type" | "reference">;
export type MMSourceDescriptionState = Pick<
  MMSource,
  "title" | "type" | "link" | "year" | "comment"
> & {
  id?: string;
  references: ReferenceState[];
  pieceVersions?: Pick<PieceVersionState, "id">[];
} & IsNewProp &
  GoNextProp;

export type MMSourcePieceVersionsState = Pick<
  MMSourcesOnPieceVersions,
  "rank"
> & {
  pieceVersionId: string;
} & IsNewProp;

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
> & { id?: string; composerId?: string };
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
  id?: string;
  tempoIndication: OptionInput;
};
export type MovementInput = Pick<Movement, "rank"> & {
  id?: string;
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
