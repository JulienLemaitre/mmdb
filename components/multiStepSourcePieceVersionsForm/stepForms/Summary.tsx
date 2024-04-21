import React from "react";
import { useSourceOnPieceVersionsForm } from "@/components/context/SourceOnPieceVersionFormContext";
import { allExpanded, darkStyles, JsonView } from "react-json-view-lite";
import { useFeedForm } from "@/components/context/feedFormContext";

function Summary({ onFormClose }: { onFormClose: () => void }) {
  const { state, dispatch } = useSourceOnPieceVersionsForm();
  const { state: feedFormState, dispatch: feedFormDispatch } = useFeedForm();
  const onAddPieceVersionOnSource = () => {
    if (!state.pieceVersion?.id) {
      console.log(
        `[onAddPieceVersionOnSource] ERROR: state.pieceVersion?.id SHOULD BE DEFINED`,
      );
      return;
    }
    // if (!feedFormState.mMSourceDescription?.id) {
    //   console.log(
    //     `[onAddPieceVersionOnSource] ERROR: feedFormState.mMSourceDescription?.id SHOULD BE DEFINED`,
    //   );
    //   return;
    // }
    feedFormDispatch({
      type: "mMSourcePieceVersions",
      payload: {
        array: [
          {
            pieceVersionId: state.pieceVersion?.id,
            // mMSourceId: feedFormState.mMSourceDescription?.id,
            rank: (feedFormState.mMSourcePieceVersions || []).length + 1,
          },
        ],
      },
    });

    // reset sourceOnPieceVersionForm
    dispatch({ type: "init" });
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
        onClick={onAddPieceVersionOnSource}
        className="btn btn-primary mt-4"
      >
        Confirm adding this piece
      </button>
    </div>
  );
}

export default Summary;
