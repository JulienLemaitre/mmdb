import React from "react";
import { useSourceOnPieceVersionsForm } from "@/components/context/SourceOnPieceVersionFormContext";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import DebugBox from "@/components/DebugBox";

function Summary({ onFormClose }: { onFormClose: () => void }) {
  const { state } = useSourceOnPieceVersionsForm();
  const { state: feedFormState, dispatch: feedFormDispatch } = useFeedForm();

  const onAddSourceOnPieceVersions = () => {
    if (!state.pieceVersion?.id) {
      console.log(
        `[onAddPieceVersionOnSource] ERROR: state.pieceVersion?.id SHOULD BE DEFINED`,
      );
      return;
    }
    updateFeedForm(feedFormDispatch, "mMSourcePieceVersions", {
      array: [
        {
          pieceVersionId: state.pieceVersion?.id,
          rank: (feedFormState.mMSourcePieceVersions || []).length + 1,
        },
      ],
    });

    onFormClose();
  };

  return (
    <div>
      <DebugBox stateObject={state} />
      <button
        onClick={onAddSourceOnPieceVersions}
        className="btn btn-primary mt-4"
      >
        Confirm adding this piece
      </button>
    </div>
  );
}

export default Summary;
