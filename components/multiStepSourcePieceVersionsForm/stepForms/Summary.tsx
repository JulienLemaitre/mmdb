import React from "react";
import { useSourceOnPieceVersionsForm } from "@/components/context/SourceOnPieceVersionFormContext";
import { allExpanded, darkStyles, JsonView } from "react-json-view-lite";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";

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
      <div className="text-[0.6em]">
        <JsonView
          data={state}
          shouldExpandNode={allExpanded}
          style={darkStyles}
        />
      </div>
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
