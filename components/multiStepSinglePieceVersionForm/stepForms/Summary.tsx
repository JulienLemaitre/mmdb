import React from "react";
import DebugBox from "@/components/DebugBox";

function Summary({ state, onAddSourceOnPieceVersions }) {
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
