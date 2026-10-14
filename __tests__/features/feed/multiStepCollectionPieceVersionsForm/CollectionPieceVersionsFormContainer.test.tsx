import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { FeedFormProvider } from "@/context/feedFormContext";
import { CollectionPieceVersionsFormProvider } from "@/context/collectionPieceVersionForm/collectionPieceVersionsFormContext";
import { useCollectionPieceVersionsForm } from "@/context/collectionPieceVersionForm/collectionPieceVersionsFormContext";
import CollectionPieceVersionsFormContainer from "@/features/feed/multiStepCollectionPieceVersionsForm/CollectionPieceVersionsFormContainer";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
import { PersonState } from "@/types/formTypes";
import { FEED_FORM_INITIAL_STATE } from "@/utils/constants";
import { PIECE_CATEGORY } from "@/prisma/client/enums";

jest.mock(
  "@/features/feed/multiStepSinglePieceVersionForm/stepForms/ComposerSelectOrCreate",
  () => ({
    __esModule: true,
    default: ({
      onComposerSelect,
    }: {
      onComposerSelect: (person: PersonState) => void;
    }) => (
      <div>
        <button
          onClick={() =>
            onComposerSelect({
              id: "composer-1",
              firstName: "Ludwig van",
              lastName: "Beethoven",
              birthYear: 1770,
              deathYear: 1827,
            })
          }
        >
          Select same composer
        </button>
        <button
          onClick={() =>
            onComposerSelect({
              id: "composer-2",
              firstName: "Johann Sebastian",
              lastName: "Bach",
              birthYear: 1685,
              deathYear: 1750,
            })
          }
        >
          Select different composer
        </button>
      </div>
    ),
  }),
);

jest.mock(
  "@/features/feed/multiStepCollectionPieceVersionsForm/stepForms/CollectionSelectOrCreate",
  () => ({ __esModule: true, default: () => null }),
);

jest.mock(
  "@/features/feed/multiStepCollectionPieceVersionsForm/stepForms/CollectionPieceVersionSelectOrCreate",
  () => ({ __esModule: true, default: () => null }),
);

jest.mock("@/ui/DebugBox", () => ({ __esModule: true, default: () => null }));

const COLLECTION_STORAGE_KEY = "test:collectionComposerRegression";
const FEED_STORAGE_KEY = "test:feedComposerRegression";

const existingComposer: PersonState = {
  id: "composer-1",
  firstName: "Ludwig van",
  lastName: "Beethoven",
  birthYear: 1770,
  deathYear: 1827,
};

const otherComposer: PersonState = {
  id: "composer-2",
  firstName: "Johann Sebastian",
  lastName: "Bach",
  birthYear: 1685,
  deathYear: 1750,
};

const initialCollectionFormState: CollectionPieceVersionsFormState = {
  formInfo: {
    currentStepRank: 0,
    collectionFirstMMSourceOnPieceVersionRank: 1,
  },
  collection: {
    id: "collection-1",
    composerId: existingComposer.id,
    title: "Symphonies",
    pieceCount: 1,
    isNew: true,
    isComposerNew: true,
  },
  persons: [existingComposer],
  pieces: [
    {
      id: "piece-1",
      title: "Symphony No. 5",
      composerId: existingComposer.id,
      collectionId: "collection-1",
      collectionRank: 1,
    },
  ],
  pieceVersions: [
    {
      id: "piece-version-1",
      pieceId: "piece-1",
      category: PIECE_CATEGORY.OTHER,
      movements: [],
    },
  ],
  tempoIndications: [{ id: "tempo-1", text: "Allegro" }],
  mMSourceOnPieceVersions: [{ pieceVersionId: "piece-version-1", rank: 1 }],
};

function CollectionStateProbe() {
  const { state } = useCollectionPieceVersionsForm();
  return (
    <output data-testid="collection-form-state">{JSON.stringify(state)}</output>
  );
}

function renderCollectionForm() {
  return render(
    <FeedFormProvider
      storageKey={FEED_STORAGE_KEY}
      initialState={FEED_FORM_INITIAL_STATE}
    >
      <CollectionPieceVersionsFormProvider
        storageKey={COLLECTION_STORAGE_KEY}
        initialState={initialCollectionFormState}
      >
        <CollectionPieceVersionsFormContainer onFormClose={jest.fn()} />
        <CollectionStateProbe />
      </CollectionPieceVersionsFormProvider>
    </FeedFormProvider>,
  );
}

function getCollectionFormState(): CollectionPieceVersionsFormState {
  return JSON.parse(
    screen.getByTestId("collection-form-state").textContent || "{}",
  );
}

describe("CollectionPieceVersionsFormContainer composer selection", () => {
  beforeEach(() => {
    localStorage.removeItem(COLLECTION_STORAGE_KEY);
    localStorage.removeItem(FEED_STORAGE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(COLLECTION_STORAGE_KEY);
    localStorage.removeItem(FEED_STORAGE_KEY);
  });

  it("preserves the selected collection and its entities when the same composer is selected", () => {
    renderCollectionForm();

    fireEvent.click(
      screen.getByRole("button", { name: "Select same composer" }),
    );

    const state = getCollectionFormState();
    expect(state.formInfo.currentStepRank).toBe(1);
    expect(state.collection).toEqual(initialCollectionFormState.collection);
    expect(state.pieces).toEqual(initialCollectionFormState.pieces);
    expect(state.pieceVersions).toEqual(
      initialCollectionFormState.pieceVersions,
    );
    expect(state.tempoIndications).toEqual(
      initialCollectionFormState.tempoIndications,
    );
    expect(state.mMSourceOnPieceVersions).toEqual(
      initialCollectionFormState.mMSourceOnPieceVersions,
    );
  });

  it("invalidates the selected collection and its entities when the composer changes", () => {
    renderCollectionForm();

    fireEvent.click(
      screen.getByRole("button", { name: "Select different composer" }),
    );

    const state = getCollectionFormState();
    expect(state.formInfo.currentStepRank).toBe(1);
    expect(state.collection?.composerId).toBe(otherComposer.id);
    expect(state.collection?.id).toBeUndefined();
    expect(state.collection?.title).toBeUndefined();
    expect(state.collection?.isNew).toBeUndefined();
    expect(state.collection?.pieceCount).toBeUndefined();
    expect(state.collection?.isComposerNew).toBeUndefined();
    expect(state.persons).toEqual([otherComposer]);
    expect(state.pieces).toEqual([]);
    expect(state.pieceVersions).toEqual([]);
    expect(state.tempoIndications).toEqual([]);
    expect(state.mMSourceOnPieceVersions).toEqual([]);
  });
});
