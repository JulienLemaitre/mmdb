// Bridge between Review working copy and Feed Form state

import { FeedFormState, ReviewContext } from "@/types/feedFormTypes";
import { FEED_FORM_BOOT_KEY } from "@/utils/constants";
import {
  ChecklistEntityType,
  ChecklistGraph,
  RequiredChecklistItem,
} from "@/features/review/ReviewChecklistSchema";
import { SinglePieceVersionFormState } from "@/types/singlePieceVersionFormTypes";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
import { getEntityByIdOrKey } from "@/context/feedFormContext";
import { debug } from "@/utils/debugLogger";

// Minimal structure for the review working copy we operate on
export type ReviewWorkingCopy = {
  graph: ChecklistGraph; // ChecklistGraph (client shape)
  updatedAt: string; // ISO timestamp
};

// Anchors used to focus a specific sub-entity inside the multistep editor
export type BridgeAnchors = {
  pvId?: string; // pieceVersionId
  movId?: string; // movementId
  secId?: string; // sectionId
  mmId?: string; // metronomeMarkId
};

// Draft mapping from entity types in checklist field paths to feed form step ranks
export const STEP_FOR_ENTITY: Record<ChecklistEntityType, number> = {
  MM_SOURCE: 1,
  MM_SOURCE_ON_PIECE_VERSION: 3,
  COLLECTION: 3,
  PIECE: 3,
  PIECE_VERSION: 3,
  MOVEMENT: 3,
  SECTION: 3,
  TEMPO_INDICATION: 3,
  METRONOME_MARK: 4,
  REFERENCE: 1,
  CONTRIBUTION: 2,
  PERSON: 2,
  ORGANIZATION: 2,
};

export type FeedBootType = {
  feedFormState: FeedFormState;
  singlePieceVersionFormState?: SinglePieceVersionFormState;
  collectionPieceVersionsFormState?: CollectionPieceVersionsFormState;
};

export function resolveStepFromReviewItem(
  item: RequiredChecklistItem,
  workingCopy: ReviewWorkingCopy,
): number {
  const { entityType } = item;

  // If PERSON item type and not among contributions, we return step 3 => it is a collection or piece composer
  if (
    entityType === "PERSON" &&
    !workingCopy.graph.contributions.some(
      (c) => "person" in c && c.person?.id === item.entityId,
    )
  ) {
    return 3;
  }

  return STEP_FOR_ENTITY[entityType] ?? 0;
}

// Build a FeedFormState from a review working copy and the clicked checklist item
export function buildFeedFormBootStateFromWorkingCopy(
  workingCopy: ReviewWorkingCopy,
  clickedItem: RequiredChecklistItem, // Accept the whole item
  opts: { reviewId: string; sliceKey?: string; anchors?: BridgeAnchors },
): FeedBootType {
  // TODO: handle the "to be reviewed only once" entities that effectively need to be reviewed

  ////////////////////// CollectionPieceVersionsForm State /////////////////////////////////////////

  // Is the clickeItem from a complete collection included in the mMSource ?
  const collectionId = clickedItem?.lineage?.collectionId;
  let collectionPieceVersionsFormState: CollectionPieceVersionsFormState | null =
    null;
  let isCollectionFormOpen = false;
  let isSinglePieceFormOpen = false;

  if (collectionId) {
    const pieceCollection = getEntityByIdOrKey(
      workingCopy.graph,
      "collections",
      collectionId,
    );
    const collectionPieceCount = pieceCollection.pieceCount;
    const collectionPiecesInSource = workingCopy.graph.pieces.filter(
      (p) => p.collectionId === collectionId,
    );

    // Collection context must be built only if the complete collection is included in the mMSource
    isCollectionFormOpen =
      collectionPiecesInSource.length === collectionPieceCount;

    if (isCollectionFormOpen) {
      console.log(`--- isCollectionFormOpen: building collection context ---`);
      try {
        // Find rank of collection first piece in mMSource
        const collectionFirstPiece = collectionPiecesInSource.find(
          (p) => p.collectionRank === 1,
        );
        if (!collectionFirstPiece) {
          console.warn(
            `No collection first piece found for collectionPiecesInSource`,
            JSON.stringify(collectionPiecesInSource, null, 2),
          );
          throw new Error("No collection first piece found");
        }

        const collectionFirstMMSourceOnPieceVersionRank =
          workingCopy.graph.sourceOnPieceVersions.find(
            (sopv) => sopv.pieceId === collectionFirstPiece?.id,
          )?.rank;

        if (!collectionFirstMMSourceOnPieceVersionRank) {
          console.warn(
            `No sourceOnPieceVersion found for collection first piece`,
            JSON.stringify(collectionFirstPiece),
          );
          throw new Error(
            "No sourceOnPieceVersion found for collection first piece",
          );
        }

        collectionPieceVersionsFormState = {
          formInfo: {
            currentStepRank: 1, // TODO
            isSinglePieceVersionFormOpen: [
              "PIECE",
              "PIECE_VERSION",
              "MOVEMENT",
              "SECTION",
              "TEMPO_INDICATION",
            ].includes(clickedItem.entityType),
            allSourceOnPieceVersionsDone: true,
            collectionFirstMMSourceOnPieceVersionRank,
          },
          collection: {
            composerId: pieceCollection.composerId,
            title: pieceCollection.title,
          },
          mMSourceOnPieceVersions: collectionPiecesInSource.map((piece) => {
            const pieceVersion = workingCopy.graph.pieceVersions.find(
              (pv) => pv.pieceId === piece.id,
            );
            return {
              pieceVersionId: pieceVersion?.id as string,
              rank: piece?.collectionRank as number,
            };
          }),
          persons: [],
          pieces: [],
          pieceVersions: [],
          tempoIndications: [],
        };
      } catch (error) {
        console.error("Error building collection context:", error);
      }
    }
  }

  ////////////////////// SinglePieceVersionForm State /////////////////////////////////////////

  let singlePieceVersionFormState: SinglePieceVersionFormState | null = null;
  const pieceId = clickedItem?.lineage?.pieceId;

  if (pieceId) {
    console.log(`--- pieceId: building singlePiece context ---`);

    const piece = getEntityByIdOrKey(workingCopy.graph, "pieces", pieceId);
    const pieceVersionId = clickedItem?.lineage?.pieceVersionId;

    const currentStepRank = {
      PERSON: 1,
      PIECE: 2,
      PIECE_VERSION: 3,
    }[clickedItem.entityType];

    singlePieceVersionFormState = {
      formInfo: {
        currentStepRank,
        ...(isCollectionFormOpen && {
          mMSourceOnPieceVersionRank: piece.collectionRank,
        }),
      },
      composer: { id: piece.composerId },
      piece: { id: piece.id },
      pieceVersion: { id: pieceVersionId },
    };
  }

  ////////////////////// MMSourceForm State /////////////////////////////////////////

  const step = resolveStepFromReviewItem(clickedItem, workingCopy);

  // Build anchors directly from the item's lineage, which is now reliable
  const anchors: BridgeAnchors = {
    pvId: clickedItem.lineage.pieceVersionId,
    movId: clickedItem.lineage.movementId,
    // You can add more as needed, e.g., for a specific section
    ...(clickedItem.entityType === "SECTION" && clickedItem.entityId
      ? {
          secId: clickedItem.entityId,
        }
      : {}),
  };

  const reviewContext: ReviewContext = {
    reviewId: opts.reviewId, // This needs to be passed in `opts`
    reviewEdit: true,
    updatedAt: new Date().toISOString(),
    anchors,
  };

  // Since the shapes are aligned, this is now mostly a deep copy.
  const feedFormState: FeedFormState = {
    formInfo: {
      currentStepRank: step,
      introDone: true, // Always skip the intro in review-edit mode
      reviewContext,

      ...((isCollectionFormOpen || isSinglePieceFormOpen) && {
        isSourceOnPieceVersionformOpen:
          isCollectionFormOpen || isSinglePieceFormOpen,
        formType: isCollectionFormOpen ? "collection" : "single",
      }),
    },
    // Deep-copy all the relevant slices from the working copy graph
    mMSourceDescription: { ...workingCopy.graph.source },
    mMSourceContributions: [...(workingCopy.graph.contributions ?? [])],
    mMSourceOnPieceVersions: [
      ...(workingCopy.graph.sourceOnPieceVersions ?? []),
    ],
    organizations: [...(workingCopy.graph.organizations ?? [])],
    collections: [...(workingCopy.graph.collections ?? [])],
    persons: [...(workingCopy.graph.persons ?? [])],
    pieces: [...(workingCopy.graph.pieces ?? [])],
    pieceVersions: [...(workingCopy.graph.pieceVersions ?? [])],
    tempoIndications: [...(workingCopy.graph.tempoIndications ?? [])],
    metronomeMarks: [...(workingCopy.graph.metronomeMarks ?? [])],
  };

  const feedFormBootState: FeedBootType = {
    feedFormState,
    ...(collectionPieceVersionsFormState && {
      collectionPieceVersionsFormState,
    }),
    ...(singlePieceVersionFormState && {
      singlePieceVersionFormState,
    }),
  };
  console.log(`[] feedFormBootState :`, feedFormBootState);
  return feedFormBootState;
}

/**
 * JSDoc: Rebuilds the review's working copy graph from the state of the feed form.
 *
 * This function creates the next version of the `ChecklistGraph` after a user
 * finishes an editing session in the `feedForm`. It treats the incoming
 * `feedFormState` as the definitive source of truth. Any entities removed
 * by the user in the form will be absent from the new working copy.
 *
 * It performs a direct translation from the `FeedFormState` shape to the
 * `ChecklistGraph` shape, reconstructs any derived data (like `tempoIndications`),
 * and preserves immutable system fields (like `permalink`) from the previous copy.
 */
export function rebuildWorkingCopyFromFeedForm(
  feedFormState: FeedFormState,
  previousWorkingCopy: ReviewWorkingCopy,
): ReviewWorkingCopy {
  const prevGraph = previousWorkingCopy.graph || {};

  // If the feedFormState is not from a review edit session, do nothing.
  if (!feedFormState?.formInfo?.reviewContext) {
    return previousWorkingCopy;
  }

  // The incoming feedFormState is the source of truth.
  // Default to empty arrays for any missing top-level properties.
  const source = {
    ...prevGraph.source, // Preserve non-editable fields like id, permalink
    ...feedFormState.mMSourceDescription,
  };
  const contributions = feedFormState.mMSourceContributions ?? [];
  const organizations = feedFormState.organizations ?? [];
  const persons = feedFormState.persons ?? [];
  const collections =
    feedFormState.collections?.map((c) => ({
      ...c,
      pieceCount:
        feedFormState.pieces?.filter((p) => p.collectionId === c.id).length ||
        NaN,
    })) ?? [];
  const pieces = feedFormState.pieces ?? [];
  const pieceVersions = feedFormState.pieceVersions ?? [];
  const metronomeMarks = feedFormState.metronomeMarks ?? [];

  // Rebuild derived data: `tempoIndications` are collected from within the piece structure.
  const tempoIndicationMap = new Map<string, { id: string; text: string }>();
  for (const pv of pieceVersions) {
    for (const m of (pv as any).movements ?? []) {
      for (const s of (m as any).sections ?? []) {
        const ti = s.tempoIndication;
        if (ti?.id) {
          tempoIndicationMap.set(ti.id, { id: ti.id, text: ti.text ?? "" });
        }
      }
    }
  }
  const tempoIndications = Array.from(tempoIndicationMap.values());

  // Rebuild derived data: `sourceOnPieceVersions` needs to be enriched with data
  // from the newly defined pieces and pieceVersions.
  const sourceOnPieceVersions = (
    feedFormState.mMSourceOnPieceVersions ?? []
  ).map((j) => {
    const pv = pieceVersions.find((pv) => pv.id === j.pieceVersionId);
    const piece = pv ? pieces.find((p) => p.id === pv.pieceId) : undefined;
    return {
      joinId: `join-${j.pieceVersionId}`, // Regenerate joinId for simplicity
      mMSourceId: source.id,
      pieceVersionId: j.pieceVersionId,
      rank: j.rank,
      pieceId: pv?.pieceId as string, // TODO: replace by type safeguards for mandatory entities in workingCopy (coming from persisted MMSource)
      collectionId: piece?.collectionId ?? undefined,
      collectionRank: piece?.collectionRank ?? undefined,
    };
  });

  const nextGraph: ChecklistGraph = {
    source,
    contributions,
    organizations,
    persons,
    collections,
    pieces,
    pieceVersions,
    metronomeMarks,
    tempoIndications,
    sourceOnPieceVersions,
  };
  debug.info(`[rebuildWorkingCopyFromFeedForm] nextGraph :`, nextGraph);

  return {
    graph: nextGraph,
    updatedAt: new Date().toISOString(),
  };
}

// Utilities to write/read the boot payload used to start the feed form in review edit mode
export function writeBootStateForFeedForm({
  feedFormState,
  singlePieceVersionFormState,
  collectionPieceVersionsFormState,
}: FeedBootType) {
  try {
    localStorage.setItem(
      FEED_FORM_BOOT_KEY,
      JSON.stringify({
        feedFormState,
        singlePieceVersionFormState,
        collectionPieceVersionsFormState,
      }),
    );
  } catch {
    // ignore
  }
}

export function consumeBootStateForFeedForm(): FeedBootType | null {
  try {
    const raw = localStorage.getItem(FEED_FORM_BOOT_KEY);
    if (!raw) return null;
    localStorage.removeItem(FEED_FORM_BOOT_KEY);
    return JSON.parse(raw) as FeedBootType;
  } catch {
    return null;
  }
}
