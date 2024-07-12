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
  NOTE_VALUE,
  Contribution,
  Collection,
} from "@prisma/client";
import {
  FeedFormState,
  PersistableFeedFormState,
} from "@/components/context/feedFormContext";
import { FC } from "react";
import { SinglePieceVersionFormState } from "@/components/context/SinglePieceVersionFormContext";
import { CollectionPieceVersionsFormState } from "@/components/context/CollectionPieceVersionsFormContext";

// Related Types

export type SourceOnPieceVersionsFormType = "single" | "collection" | "none";

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
export type SinglePieceVersionFormStep = {
  id: string;
  title: string;
  rank: number;
  isComplete: (state: SinglePieceVersionFormState) => boolean;
  Component?: FC<any>; // TODO precise type
  actionTypes: string[];
};
export type CollectionPieceVersionsFormStep = {
  id: string;
  title: string;
  rank: number;
  isComplete: (state: CollectionPieceVersionsFormState) => boolean;
  Component?: FC<any>; // TODO precise type
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
export type OrganizationState = {
  id: string;
  name: string;
} & IsNewProp;
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

export type CollectionState = Pick<Collection, "composerId" | "title"> & {
  id?: string;
  _count?: {
    pieces?: number;
  };
} & IsNewProp;

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
  tempoIndication: Pick<TempoIndication, "id" | "text">;
};
export type SectionStateExtendedForMMForm = SectionState & {
  movement: Omit<MovementState, "sections">;
  mMSourceOnPieceVersion: { rank: number; pieceVersionId: string };
  pieceId: string;
};

export type MovementState = Pick<Movement, "id" | "rank" | "key"> & {
  sections: SectionState[];
};

export type TempoIndicationState = Pick<TempoIndication, "id" | "text"> &
  IsNewProp;

export type PieceVersionState = Pick<
  PieceVersion,
  "id" | "category" | "pieceId"
> & {
  movements: MovementState[];
} & IsNewProp;
export type NewPieceVersionState = PieceVersionState & IsNewProp;

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

export type MetronomeMarkState =
  | (Pick<MetronomeMark, "sectionId" | "bpm" | "comment" | "beatUnit"> & {
      id?: string;
      pieceVersionRank: number;
      pieceVersionId: string;
      noMM: false;
    })
  | (Pick<MetronomeMark, "sectionId"> & {
      id?: string;
      pieceVersionRank: number;
      pieceVersionId: string;
      noMM: true;
    });

// Form INPUTS

export type OptionInput = {
  value: string;
  label: string;
};
export type OptionInputTyped<T> = {
  value: T;
  label: T;
};

export type PersonInput = Pick<
  Person,
  "firstName" | "lastName" | "birthYear" | "deathYear"
> & { id?: string };
export type CollectionInput = Pick<Collection, "composerId" | "title"> & {
  id?: string;
};
export type CollectionTitleInput = Pick<Collection, "title"> & {
  id?: string;
};
export type PieceInput = Pick<
  Piece,
  "nickname" | "yearOfComposition" | "title"
> & { id?: string; composerId?: string };
export type SectionInput = Pick<
  Section,
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
export type MovementInput = {
  id?: string;
  key: OptionInput;
  sections: SectionInput[];
};
export type PieceVersionInput = {
  id?: string;
  pieceId: string;
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

export type MetronomeMarkInput =
  | (Pick<MetronomeMark, "sectionId" | "bpm" | "comment"> & {
      beatUnit: OptionInputTyped<NOTE_VALUE>;
      noMM: false;
    })
  | (Pick<MetronomeMark, "sectionId"> & {
      noMM: true;
    });

export function assertsIsPersistableFeedFormState(
  valueToTest: any,
): asserts valueToTest is PersistableFeedFormState {
  if (
    !(
      valueToTest &&
      typeof valueToTest === "object" &&
      "formInfo" in valueToTest &&
      typeof valueToTest["formInfo"] === "object" &&
      "mMSourceDescription" in valueToTest &&
      typeof valueToTest["mMSourceDescription"] === "object" &&
      "mMSourceContributions" in valueToTest &&
      Array.isArray(valueToTest.mMSourceContributions) &&
      valueToTest.mMSourceContributions.length > 0 &&
      "mMSourcePieceVersions" in valueToTest &&
      Array.isArray(valueToTest.mMSourcePieceVersions) &&
      valueToTest.mMSourcePieceVersions.length > 0 &&
      "metronomeMarks" in valueToTest &&
      Array.isArray(valueToTest.metronomeMarks) &&
      valueToTest.metronomeMarks.length > 0 &&
      "organizations" in valueToTest &&
      Array.isArray(valueToTest.organizations) &&
      "persons" in valueToTest &&
      Array.isArray(valueToTest.persons) &&
      "pieces" in valueToTest &&
      Array.isArray(valueToTest.pieces) &&
      "pieceVersions" in valueToTest &&
      Array.isArray(valueToTest.pieceVersions) &&
      "tempoIndications" in valueToTest &&
      Array.isArray(valueToTest.tempoIndications)
    )
  ) {
    throw new Error(
      `Value does not appear to be a PersistableFeedFormState: ${valueToTest}`,
    );
  }
}

type MetronomeMarkStateWithValue = MetronomeMarkState & { noMM: false };
export function assertsIsMetronomeMarkWithValue(
  valueToTest: any,
): asserts valueToTest is MetronomeMarkStateWithValue {
  if (
    !(
      valueToTest &&
      typeof valueToTest === "object" &&
      "sectionId" in valueToTest &&
      typeof valueToTest["sectionId"] === "string" &&
      "bpm" in valueToTest &&
      typeof valueToTest["bpm"] === "number" &&
      "beatUnit" in valueToTest &&
      typeof valueToTest["beatUnit"] === "string" &&
      "noMM" in valueToTest &&
      valueToTest["noMM"] === false
    )
  ) {
    throw new Error(
      `Value does not appear to be a MetronomeMarkState with noMM === false: ${valueToTest}`,
    );
  }
}

type PersistableContribution = Pick<Contribution, "role"> & {
  id?: string;
  personId: string;
  organizationId: null;
};
export function assertsContributionHasPersonOrOrganization(
  valueToTest: any,
): asserts valueToTest is PersistableContribution {
  if (
    !(
      (valueToTest &&
        typeof valueToTest === "object" &&
        "role" in valueToTest &&
        typeof valueToTest["role"] === "string" &&
        "person" in valueToTest &&
        typeof valueToTest["person"] === "object" &&
        (("organization" in valueToTest &&
          valueToTest["organization"] == null) ||
          !("organization" in valueToTest))) ||
      (valueToTest &&
        typeof valueToTest === "object" &&
        "role" in valueToTest &&
        typeof valueToTest["role"] === "string" &&
        (("person" in valueToTest && valueToTest["person"] == null) ||
          !("person" in valueToTest)) &&
        "organization" in valueToTest &&
        typeof valueToTest["organization"] === "object")
    )
  ) {
    throw new Error(
      `Value does not appear to be a PersistableContribution: ${valueToTest}`,
    );
  }
}
