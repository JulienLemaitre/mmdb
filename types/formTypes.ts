import type {
  CONTRIBUTION_ROLE,
  KEY,
  NOTE_VALUE,
  PIECE_CATEGORY,
  Prisma,
  REFERENCE_TYPE,
  SOURCE_TYPE,
} from "@prisma/client";
import { FC } from "react";
import { WithRequiredId } from "@/types/typescriptUtils";
import { FeedFormState, PersistableFeedFormState } from "@/types/feedFormTypes";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
import { SinglePieceVersionFormState } from "@/types/singlePieceVersionFormTypes";

// Related Types

export type SourceOnPieceVersionsFormType = "single" | "collection" | "none";

// Sub-Types

export type ReferenceTypeAndReference = Pick<
  Prisma.ReferenceCreateInput,
  "type" | "reference"
>;

// More generic types

export type InputMethod =
  | "none"
  | "text"
  | "decimal"
  | "numeric"
  | "tel"
  | "search"
  | "email"
  | "url";

export type KeyBase =
  | "fastestStructuralNotes"
  | "fastestStaccatoNotes"
  | "fastestOrnamentalNotes"
  | "fastestRepeatedNotes";

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
export type IsNewTrue = {
  isNew: true;
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

export type CollectionState = WithRequiredId<
  Pick<Prisma.CollectionUncheckedCreateInput, "id" | "composerId" | "title">
> &
  IsNewProp;

export type PieceState = WithRequiredId<
  Pick<
    Prisma.PieceUncheckedCreateInput,
    | "id"
    | "nickname"
    | "yearOfComposition"
    | "title"
    | "composerId"
    | "collectionId"
    | "collectionRank"
  >
> &
  IsNewProp;
export type PieceStateWithCollectionRank = PieceState & {
  collectionRank: number;
};

export type SectionState = WithRequiredId<
  Pick<
    Prisma.SectionUncheckedCreateInput,
    | "id"
    | "rank"
    | "metreNumerator"
    | "metreDenominator"
    | "isCommonTime"
    | "isCutTime"
    | "comment"
    | "commentForReview"
    | "fastestStructuralNotesPerBar"
    | "fastestStaccatoNotesPerBar"
    | "fastestRepeatedNotesPerBar"
    | "fastestOrnamentalNotesPerBar"
    | "isFastestStructuralNoteBelCanto"
  >
> & {
  tempoIndication: WithRequiredId<
    Pick<Prisma.TempoIndicationUncheckedCreateInput, "id" | "text">
  >;
};
export type SectionStateExtendedForMMForm = SectionState & {
  movement: Omit<MovementState, "sections">;
  mMSourceOnPieceVersion: { rank: number; pieceVersionId: string };
  pieceId: string;
};

export type MovementState = WithRequiredId<
  Pick<Prisma.MovementUncheckedCreateInput, "id" | "rank" | "key">
> & {
  sections: SectionState[];
};

export type TempoIndicationState = WithRequiredId<
  Pick<Prisma.TempoIndicationUncheckedCreateInput, "id" | "text">
> &
  IsNewProp;

export type PieceVersionState = Pick<
  Prisma.PieceVersionUncheckedCreateInput,
  "category" | "pieceId"
> & {
  id: string;
  movements: MovementState[];
} & IsNewProp;

export type ReferenceState = Pick<
  Prisma.ReferenceUncheckedCreateInput,
  "type" | "reference"
> & {
  id?: string; // present when used in a review context
};
export type MMSourceDescriptionState = Pick<
  Prisma.MMSourceUncheckedCreateInput,
  "title" | "type" | "link" | "year" | "comment"
> & {
  id?: string;
  references: ReferenceState[];
  pieceVersions?: Pick<PieceVersionState, "id">[];
  permalink?: string; // present when used in a review context
} & IsNewProp &
  GoNextProp;

export type MMSourceOnPieceVersionsState = Pick<
  Prisma.MMSourcesOnPieceVersionsUncheckedCreateInput,
  "rank" | "pieceVersionId"
> &
  IsNewProp;

export type MetronomeMarkState =
  | (Pick<
      Prisma.MetronomeMarkUncheckedCreateInput,
      "sectionId" | "bpm" | "comment" | "beatUnit"
    > & {
      id?: string;
      pieceVersionId: string;
      noMM: false;
    })
  | (Pick<Prisma.MetronomeMarkUncheckedCreateInput, "sectionId"> & {
      id?: string;
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
  label: string;
};

export type PersonInput = Pick<
  Prisma.PersonUncheckedCreateInput,
  "firstName" | "lastName" | "birthYear" | "deathYear"
> & {
  id?: string;
};
export type CollectionInput = Pick<
  Prisma.CollectionUncheckedCreateInput,
  "composerId" | "title"
> & {
  id?: string;
};
export type CollectionTitleInput = Pick<
  Prisma.CollectionUncheckedCreateInput,
  "title"
> & {
  id?: string;
};
export type PieceInput = Pick<
  Prisma.PieceUncheckedCreateInput,
  "nickname" | "title" | "yearOfComposition"
> & {
  id?: string;
  composerId?: string;
};
export type SectionInput = Omit<
  Prisma.SectionCreateWithoutMovementInput,
  "tempoIndication" | "metronomeMarks" | "rank"
> & {
  tempoIndication: OptionInput;
};
export type MovementInput = {
  id?: string;
  key: OptionInputTyped<KEY>;
  sections: SectionInput[];
};
export type PieceVersionInput = {
  id?: string;
  category: OptionInputTyped<PIECE_CATEGORY>;
  movements: MovementInput[];
};
export type ReferenceInput = {
  type: OptionInputTyped<REFERENCE_TYPE>;
  reference: string;
};

export type SourceDescriptionInput = Pick<
  Prisma.MMSourceUncheckedCreateInput,
  "link"
> & {
  id?: string;
  comment?: string;
  title?: string;
  year: number;
  references: ReferenceInput[];
  type: OptionInputTyped<SOURCE_TYPE>;
};

export type ContributionInput = {
  role: OptionInputTyped<CONTRIBUTION_ROLE>;
} & (
  | {
      person: PersonInput;
    }
  | {
      organization: Pick<
        Prisma.OrganizationUncheckedCreateInput,
        "id" | "name"
      >;
    }
);

export type MetronomeMarkInput =
  | (Pick<
      Prisma.MetronomeMarkUncheckedCreateInput,
      "sectionId" | "bpm" | "comment"
    > & {
      beatUnit: OptionInputTyped<NOTE_VALUE>;
      noMM: false;
    })
  | (Pick<Prisma.MetronomeMarkUncheckedCreateInput, "sectionId" | "comment"> & {
      noMM: true;
    });

export type SearchFormInput = {
  startYear: number;
  endYear: number;
  tempoIndicationIds: string[];
  composer: OptionInput;
};

export function assertsIsPersistableFeedFormState(
  valueToTest: any,
): asserts valueToTest is PersistableFeedFormState {
  if (
    !(
      valueToTest &&
      typeof valueToTest === "object" &&
      "formInfo" in valueToTest &&
      typeof valueToTest["formInfo"] === "object" &&
      typeof valueToTest["formInfo"]["reviewContext"] === "undefined" && // Not persistable if used in a review
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

type PersistableContribution = Pick<
  Prisma.ContributionUncheckedCreateInput,
  "role"
> & {
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

export type PiecePieceVersion = { pieceId: string; pieceVersionId: string };
