import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
import { FeedFormState } from "@/types/feedFormTypes";
import { TempoIndicationState } from "@/types/formTypes";

type BuildCollectionPieceVersionsFormEditStateParams = {
  feedFormState: FeedFormState;
  collectionId: string;
};

export function buildCollectionPieceVersionsFormEditState({
  feedFormState,
  collectionId,
}: BuildCollectionPieceVersionsFormEditStateParams): CollectionPieceVersionsFormState | null {
  const collection = feedFormState.collections?.find(
    ({ id }) => id === collectionId,
  );
  if (!collection) {
    return null;
  }

  const pieces = (feedFormState.pieces || []).filter(
    (piece) => piece.collectionId === collectionId,
  );
  const pieceIdSet = new Set(pieces.map((piece) => piece.id));

  const pieceVersions = (feedFormState.pieceVersions || []).filter(
    (pieceVersion) => pieceIdSet.has(pieceVersion.pieceId),
  );
  const pieceVersionIdSet = new Set(
    pieceVersions.map((pieceVersion) => pieceVersion.id),
  );

  const collectionMMSourceOnPieceVersionList = (
    feedFormState.mMSourceOnPieceVersions || []
  )
    .filter((mMSourceOnPieceVersion) =>
      pieceVersionIdSet.has(mMSourceOnPieceVersion.pieceVersionId),
    )
    .toSorted((a, b) => a.rank - b.rank);

  const collectionFirstMMSourceOnPieceVersionRank =
    collectionMMSourceOnPieceVersionList[0]?.rank;
  if (!collectionFirstMMSourceOnPieceVersionRank) {
    return null;
  }

  const composerIds = new Set(
    [collection.composerId, ...pieces.map((piece) => piece.composerId)].filter(
      (composerId): composerId is string => typeof composerId === "string",
    ),
  );
  const persons = (feedFormState.persons || []).filter((person) =>
    composerIds.has(person.id),
  );

  const tempoIndicationMap = new Map<string, TempoIndicationState>();
  pieceVersions.forEach((pieceVersion) => {
    pieceVersion.movements.forEach((movement) => {
      movement.sections.forEach((section) => {
        if (section.tempoIndication) {
          tempoIndicationMap.set(
            section.tempoIndication.id,
            section.tempoIndication as TempoIndicationState,
          );
        }
      });
    });
  });

  return {
    formInfo: {
      currentStepRank: 0,
      collectionFirstMMSourceOnPieceVersionRank,
    },
    collection: {
      id: collection.id,
      composerId: collection.composerId,
      ...(collection.title && { title: collection.title }),
      ...(collection.isNew && { isNew: collection.isNew }),
      ...(typeof collection.pieceCount === "number" && {
        pieceCount: collection.pieceCount,
      }),
    },
    mMSourceOnPieceVersions: collectionMMSourceOnPieceVersionList.map(
      (mMSourceOnPieceVersion, index) => ({
        ...mMSourceOnPieceVersion,
        rank: index + 1,
      }),
    ),
    persons,
    pieces,
    pieceVersions,
    tempoIndications: Array.from(tempoIndicationMap.values()),
  };
}
