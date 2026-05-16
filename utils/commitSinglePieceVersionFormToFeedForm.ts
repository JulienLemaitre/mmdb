import { SinglePieceVersionFormState } from "@/types/singlePieceVersionFormTypes";
import { FeedFormState } from "@/types/feedFormTypes";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";

type CommitParams = {
  singlePieceVersionFormState: SinglePieceVersionFormState;
  feedFormState: FeedFormState;
  feedFormDispatch: (action: any) => void;
  isUpdateMode: boolean;
  isCollectionMode?: boolean;
  collectionFormState?: CollectionPieceVersionsFormState;
};

/**
 * Commits the data from the SinglePieceVersionForm to the global FeedForm.
 * This is a "quasi-pure" function because it calls dispatch, but it encapsulates
 * all the projection logic from the sub-form state to the global state.
 */
export function commitSinglePieceVersionFormToFeedForm({
  singlePieceVersionFormState,
  feedFormState,
  feedFormDispatch,
  isUpdateMode,
  isCollectionMode,
  collectionFormState,
}: CommitParams) {
  const { composer, piece, pieceVersion, tempoIndications, formInfo } =
    singlePieceVersionFormState;

  if (!composer || !piece || !pieceVersion) {
    console.error(
      "[commitSinglePieceVersionFormToFeedForm] Missing required entities",
      {
        composer,
        piece,
        pieceVersion,
      },
    );
    return;
  }

  // 1. Upsert entities in feedForm state

  // Upsert Persons
  feedFormDispatch({
    type: "persons",
    payload: {
      array: [structuredClone(composer)],
    },
  });

  // Upsert Pieces
  feedFormDispatch({
    type: "pieces",
    payload: {
      array: [structuredClone(piece)],
    },
  });

  // Upsert PieceVersions
  feedFormDispatch({
    type: "pieceVersions",
    payload: {
      array: [structuredClone(pieceVersion)],
    },
  });

  // Upsert TempoIndications
  if (tempoIndications && tempoIndications.length > 0) {
    feedFormDispatch({
      type: "tempoIndications",
      payload: {
        array: structuredClone(tempoIndications),
      },
    });
  }

  // 2. Mise à jour de mMSourceOnPieceVersions
  const mMSourceOnPieceVersionRank = formInfo.mMSourceOnPieceVersionRank;

  let finalRank: number;
  if (isUpdateMode && typeof mMSourceOnPieceVersionRank === "number") {
    finalRank = mMSourceOnPieceVersionRank;
  } else if (isCollectionMode && collectionFormState) {
    finalRank = (collectionFormState.mMSourceOnPieceVersions || []).length + 1;
  } else {
    finalRank = (feedFormState.mMSourceOnPieceVersions || []).length + 1;
  }

  const mMSourceOnPieceVersionPayload = {
    idKey: "rank",
    array: [
      {
        pieceVersionId: pieceVersion.id,
        rank: finalRank,
      },
    ],
  };

  feedFormDispatch({
    type: "mMSourceOnPieceVersions",
    payload: mMSourceOnPieceVersionPayload,
  });
}
