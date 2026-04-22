import { SinglePieceVersionFormState } from "@/types/singlePieceVersionFormTypes";
import { FeedFormState } from "@/types/feedFormTypes";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
import { TempoIndicationState } from "@/types/formTypes";

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
  const { composer, piece, pieceVersion, formInfo } =
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

  // 1. Extraction des tempoIndications de la pieceVersion
  const tempoIndications: TempoIndicationState[] = [];
  const tempoIndicationMap = new Map<string, TempoIndicationState>();

  pieceVersion.movements.forEach((movement) => {
    movement.sections.forEach((section) => {
      if (section.tempoIndication) {
        const ti = section.tempoIndication as TempoIndicationState;
        if (!tempoIndicationMap.has(ti.id)) {
          tempoIndicationMap.set(ti.id, ti);
          tempoIndications.push(ti);
        }
      }
    });
  });

  // 2. Upsert des entités dans le global state (via dispatch)
  // On utilise FeedFormDispatch pour chaque type d'entité.

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
  if (tempoIndications.length > 0) {
    feedFormDispatch({
      type: "tempoIndications",
      payload: {
        array: structuredClone(tempoIndications),
      },
    });
  }

  // 3. Mise à jour de mMSourceOnPieceVersions
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
