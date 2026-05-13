import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
import { FeedFormState } from "@/types/feedFormTypes";
import {
  CollectionState,
  MMSourceOnPieceVersionsState,
  PieceState,
} from "@/types/formTypes";

type CommitCollectionPieceVersionsFormToFeedFormParams = {
  collectionPieceVersionFormState: CollectionPieceVersionsFormState;
  sourceOnPieceVersions: MMSourceOnPieceVersionsState[];
  feedFormState: FeedFormState;
  feedFormDispatch: (action: any) => void;
};

/**
 * Commits the data from the CollectionPieceVersionsForm to the global FeedForm.
 * This is a "quasi-pure" function because it calls dispatch, but it encapsulates
 * all projection logic from local collection state to global feed state.
 */
export function commitCollectionPieceVersionsFormToFeedForm({
  collectionPieceVersionFormState,
  sourceOnPieceVersions,
  feedFormState,
  feedFormDispatch,
}: CommitCollectionPieceVersionsFormToFeedFormParams): boolean {
  const {
    collection,
    persons = [],
    pieces = [],
    pieceVersions = [],
    tempoIndications = [],
    formInfo,
  } = collectionPieceVersionFormState;

  if (!collection?.id || !collection.composerId || !collection.title) {
    console.error(
      "[commitCollectionPieceVersionsFormToFeedForm] Missing collection id or composerId",
      { collection },
    );
    return false;
  }

  if (sourceOnPieceVersions.length === 0) {
    console.error(
      "[commitCollectionPieceVersionsFormToFeedForm] Missing sourceOnPieceVersions",
    );
    return false;
  }

  const pieceVersionsById = new Map(pieceVersions.map((pv) => [pv.id, pv]));
  const piecesById = new Map(pieces.map((p) => [p.id, p]));

  const allSourceOnPieceVersionsValid = sourceOnPieceVersions.every((sopv) => {
    const correspondingPieceVersion = pieceVersionsById.get(
      sopv.pieceVersionId,
    );
    return (
      !!correspondingPieceVersion &&
      piecesById.has(correspondingPieceVersion.pieceId)
    );
  });

  if (!allSourceOnPieceVersionsValid) {
    console.error(
      "[commitCollectionPieceVersionsFormToFeedForm] At least one sourceOnPieceVersions item points to a missing local pieceVersion/piece",
      {
        sourceOnPieceVersions,
        pieceVersions,
        pieces,
      },
    );
    return false;
  }

  const isCollectionUpdate =
    typeof formInfo.collectionFirstMMSourceOnPieceVersionRank === "number";
  const lastRankBefore = isCollectionUpdate
    ? formInfo.collectionFirstMMSourceOnPieceVersionRank! - 1
    : (feedFormState.mMSourceOnPieceVersions || []).length;

  const sourceOnPieceVersionsPayload = sourceOnPieceVersions
    .toSorted((a, b) => a.rank - b.rank)
    .map((sourceOnPieceVersion) => ({
      pieceVersionId: sourceOnPieceVersion.pieceVersionId,
      rank: lastRankBefore + sourceOnPieceVersion.rank,
    }));

  const localCollectionRankByPieceId = sourceOnPieceVersions.reduce(
    (acc, sourceOnPieceVersion) => {
      const pieceVersion = pieceVersionsById.get(
        sourceOnPieceVersion.pieceVersionId,
      );
      if (!pieceVersion) {
        return acc;
      }

      const previousRank = acc.get(pieceVersion.pieceId);
      if (
        typeof previousRank !== "number" ||
        sourceOnPieceVersion.rank < previousRank
      ) {
        acc.set(pieceVersion.pieceId, sourceOnPieceVersion.rank);
      }

      return acc;
    },
    new Map<string, number>(),
  );

  const collectionAwarePieces: PieceState[] = pieces.map((piece) => {
    const localCollectionRank = localCollectionRankByPieceId.get(piece.id);
    return {
      ...piece,
      collectionId: collection.id,
      ...(typeof localCollectionRank === "number"
        ? { collectionRank: localCollectionRank }
        : {}),
    };
  });

  const collectionToCommit: CollectionState = {
    ...collection,
    title: collection.title,
    id: collection.id,
    composerId: collection.composerId,
    pieceCount: sourceOnPieceVersionsPayload.length,
  };

  if (persons.length > 0) {
    feedFormDispatch({
      type: "persons",
      payload: {
        array: persons,
      },
    });
  }

  feedFormDispatch({
    type: "collections",
    payload: {
      array: [collectionToCommit],
    },
  });

  if (collectionAwarePieces.length > 0) {
    feedFormDispatch({
      type: "pieces",
      payload: {
        array: collectionAwarePieces,
      },
    });
  }

  if (pieceVersions.length > 0) {
    feedFormDispatch({
      type: "pieceVersions",
      payload: {
        array: pieceVersions,
      },
    });
  }

  if (tempoIndications.length > 0) {
    feedFormDispatch({
      type: "tempoIndications",
      payload: {
        array: tempoIndications,
      },
    });
  }

  feedFormDispatch({
    type: "mMSourceOnPieceVersions",
    payload: {
      array: sourceOnPieceVersionsPayload,
      isCollectionUpdate,
    },
  });

  return true;
}
