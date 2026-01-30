// Bridge between Review working copy and Feed Form state

import { FeedFormState, ReviewContext } from "@/types/feedFormTypes";
import { FEED_FORM_BOOT_KEY } from "@/utils/constants";
import { SinglePieceVersionFormState } from "@/types/singlePieceVersionFormTypes";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
import { getEntityByIdOrKey } from "@/utils/getEntityByIdOrKey";
import { getNewUuid } from "@/utils/getNewUuid";
import {
  ChecklistEntityType,
  ChecklistGraph,
  GloballyReviewedEntityArrays,
  RequiredChecklistItem,
} from "@/types/reviewTypes";
import { isCollectionCompleteInChecklistGraph } from "@/features/review/utils/isCollectionCompleteInChecklistGraph";
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

export function getCurrentSinglePieceStepRank(clickedItem): number {
  if (clickedItem.entityType === "PIECE") {
    if (clickedItem.field.path.includes("composer")) {
      return 0;
    }
    return 1;
  }
  if (["PIECE_VERSION", "SECTION"].includes(clickedItem.entityType)) {
    return 2;
  }
  return 3;
}

// Build a FeedFormState from a review working copy and the clicked checklist item
export function buildFeedFormBootStateFromWorkingCopy(
  workingCopy: ReviewWorkingCopy,
  globallyReviewed: GloballyReviewedEntityArrays,
  clickedItem: RequiredChecklistItem, // Accept the whole item
  opts: { reviewId: string; sliceKey?: string; anchors?: BridgeAnchors },
): FeedBootType {
  debug.info("clickedItem", clickedItem);
  debug.info("workingCopy", workingCopy);
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
    if (pieceCollection) {
      const collectionPieceCount = pieceCollection.pieceCount;
      const collectionPiecesInSource = workingCopy.graph.pieces.filter(
        (p) => p.collectionId === collectionId,
      );

      // Collection context must be built only if the complete collection is included in the mMSource
      isCollectionFormOpen =
        collectionPiecesInSource.length === collectionPieceCount;

      if (isCollectionFormOpen) {
        console.log(
          `--- isCollectionFormOpen: building collection context ---`,
        );
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

          function getCurrentCollectionStepRank(clickedItem): number {
            if (clickedItem.entityType === "COLLECTION") {
              if (clickedItem.field.path.includes("composer")) {
                return 0;
              }
              return 1;
            }
            return 2;
          }

          collectionPieceVersionsFormState = {
            formInfo: {
              currentStepRank: getCurrentCollectionStepRank(clickedItem),
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
              isComposerNew: !globallyReviewed?.personIds?.includes(
                pieceCollection.composerId,
              ),
              title: pieceCollection.title,
              isNew: !globallyReviewed?.collectionIds?.includes(
                pieceCollection.id,
              ),
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
  }

  ////////////////////// SinglePieceVersionForm State /////////////////////////////////////////

  let singlePieceVersionFormState: SinglePieceVersionFormState | null = null;
  const pieceId = clickedItem?.lineage?.pieceId;

  if (pieceId) {
    console.log(`--- pieceId: building singlePiece context ---`);
    isSinglePieceFormOpen = true;

    const piece = getEntityByIdOrKey(workingCopy.graph, "pieces", pieceId);
    const pieceVersion = getEntityByIdOrKey(
      workingCopy.graph,
      "pieceVersions",
      pieceId,
      "pieceId",
    );
    const sourceOnPieceVersion = getEntityByIdOrKey(
      workingCopy.graph,
      "sourceOnPieceVersions",
      pieceVersion.id,
      "pieceVersionId",
    );

    singlePieceVersionFormState = {
      formInfo: {
        currentStepRank: getCurrentSinglePieceStepRank(clickedItem),
        mMSourceOnPieceVersionRank: sourceOnPieceVersion.rank,
      },
      composer: {
        id: piece.composerId,
        isNew: !globallyReviewed?.personIds?.includes(piece.composerId),
      },
      piece: {
        id: piece.id,
        isNew: !globallyReviewed?.pieceIds?.includes(piece.id),
      },
      pieceVersion: pieceVersion
        ? {
            id: pieceVersion.id,
            isNew: !globallyReviewed?.pieceVersionIds?.includes(
              pieceVersion.id,
            ),
          }
        : undefined,
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
        isSourceOnPieceVersionformOpen: true,
        formType: isCollectionFormOpen ? "collection" : "single",
      }),
    },
    // Deep-copy all the relevant slices from the working copy graph
    mMSourceDescription: { ...workingCopy.graph.source },
    mMSourceContributions: [...(workingCopy.graph.contributions ?? [])],
    mMSourceOnPieceVersions: [
      ...(workingCopy.graph.sourceOnPieceVersions ?? []),
    ],
    organizations: [
      ...(workingCopy.graph.organizations ?? []).map((o) => ({
        ...o,
        isNew: !globallyReviewed?.organizationIds?.includes(o.id),
      })),
    ],
    collections: [
      ...(workingCopy.graph.collections ?? [])
        .filter((c) =>
          isCollectionCompleteInChecklistGraph({
            collectionId: c.id,
            graph: workingCopy.graph,
          }),
        )
        .map((c) => ({
          ...c,
          isNew: !globallyReviewed?.collectionIds?.includes(c.id),
        })),
    ],
    persons: [
      ...(workingCopy.graph.persons ?? []).map((p) => ({
        ...p,
        isNew: !globallyReviewed?.personIds?.includes(p.id),
      })),
    ],
    pieces: [
      ...(workingCopy.graph.pieces ?? []).map((p) => ({
        ...p,
        isNew: !globallyReviewed?.pieceIds?.includes(p.id),
      })),
    ],
    pieceVersions: [
      ...(workingCopy.graph.pieceVersions ?? []).map((pv) => ({
        ...pv,
        isNew: !globallyReviewed?.pieceVersionIds?.includes(pv.id),
      })),
    ],
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
  console.log(`[] feedFormBootState :`, JSON.stringify(feedFormBootState));
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
    ...prevGraph.source, // Preserve non-editable fields like id, permalink, enteredBy
    ...feedFormState.mMSourceDescription,
    references: [
      ...(feedFormState.mMSourceDescription?.references || [])
        .map(forceId)
        .map(cleanIsNew),
    ],
  };
  const contributions = (feedFormState.mMSourceContributions ?? [])
    .map(forceId)
    .map(cleanIsNew);
  const organizations = (feedFormState.organizations ?? [])
    .map(forceId)
    .map(cleanIsNew);
  const persons = (feedFormState.persons ?? []).map(forceId).map(cleanIsNew);
  const collections = (
    feedFormState.collections?.filter((c) =>
      feedFormState.pieces?.some((p) => p.collectionId === c.id),
    ) ?? []
  )
    .map(forceId)
    .map(cleanIsNew);
  const pieces = (feedFormState.pieces ?? []).map(forceId).map(cleanIsNew);
  const pieceVersions = (feedFormState.pieceVersions ?? [])
    .map(forceId)
    .map(cleanIsNew);
  const metronomeMarks = (feedFormState.metronomeMarks ?? [])
    .map(forceId)
    .map(cleanIsNew);

  // Rebuild derived data: `tempoIndications` are collected from within the piece structure.
  const tempoIndicationMap = new Map<string, { id: string; text: string }>();
  for (const pv of pieceVersions) {
    for (const m of (pv as any).movements ?? []) {
      for (const s of (m as any).sections ?? []) {
        const ti = s.tempoIndication;
        if (ti?.id) {
          s.tempoIndicationId = ti.id;
          tempoIndicationMap.set(ti.id, { id: ti.id, text: ti.text ?? "" });
        } else {
          console.warn(`No tempoIndication id for section ${s.id}`, ti);
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
    // We need to find the joinId from the previous graph, because there is none in the feedFormState.
    // If this is a newly created sourceOnPieceVersion, we generate a new joinId.
    const prevSourceOnPieceVersion = prevGraph?.sourceOnPieceVersions.find(
      (spv) => spv.pieceVersionId === j.pieceVersionId,
    );
    return {
      joinId: prevSourceOnPieceVersion?.joinId ?? getNewUuid(), // Regenerate joinId for simplicity
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

  return {
    graph: nextGraph,
    updatedAt: new Date().toISOString(),
  };
}

function forceId(entity: any) {
  if (!entity) return entity;
  return {
    ...entity,
    id: entity.id || getNewUuid(),
  };
}
function cleanIsNew(entity: any) {
  if (!entity) return entity;
  if ("isNew" in entity) delete entity.isNew;
  return entity;
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
