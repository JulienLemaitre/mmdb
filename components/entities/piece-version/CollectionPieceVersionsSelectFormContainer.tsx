import React, { useState } from "react";
import {
  PiecePieceVersion,
  PieceState,
  PieceVersionInput,
  PieceVersionState,
} from "@/types/formTypes";
import PieceVersionSelectOrCreate from "@/components/multiStepSinglePieceVersionForm/stepForms/PieceVersionSelectOrCreate";
import { FeedFormState } from "@/components/context/feedFormContext";
import DebugBox from "@/components/DebugBox";
import getPieceVersionStateFromInput from "@/utils/getPieceVersionStateFromInput";

type CollectionPieceVersionsSelectFormContainer = {
  feedFormState: FeedFormState;
  pieces: PieceState[];
  onAddPieceVersion: (pieceVersion: PieceVersionState) => void;
  onSubmitPiecePieceVersions: (piecePieceVersions: PiecePieceVersion[]) => void;
};

/**
 * This container component handle the process of going piece by piece in the received pieces array
 * - Propose to select an existing pieceVersion or Create a new one
 * - Store the result and iterate to the next piece until all pieces' pieceVersions are defined.
 * @param feedFormState
 * @param pieces
 * @param onAddPieceVersion
 * @param onSubmitSourceOnPieceVersions
 * @constructor
 */
export default function CollectionPieceVersionsSelectFormContainer({
  feedFormState,
  pieces,
  onAddPieceVersion,
  onSubmitPiecePieceVersions,
}: CollectionPieceVersionsSelectFormContainer) {
  const piecesCount = pieces.length;
  const [piecePieceVersions, setPiecePieceVersions] = useState<
    PiecePieceVersion[]
  >([]);
  const [currentPieceIndex, setCurrentPieceIndex] = React.useState(0);

  const areAllPieceVersionDefined = piecePieceVersions.length === piecesCount;

  const onPieceVersionCreated = (pieceVersion: PieceVersionInput) => {
    // Front input values validation is successful at this point.
    console.log("[onPieceVersionCreated] pieceVersion", pieceVersion);

    const selectedPieceId = pieces[currentPieceIndex].id;

    if (!selectedPieceId) {
      console.log(
        `[onPieceVersionCreated] No pieces[${currentPieceIndex}].id found - cannot create pieceVersion`,
      );
      return;
    }

    const pieceVersionData = pieceVersion;
    // Remove null values from pieceVersionData
    Object.keys(pieceVersionData).forEach(
      // '== null' is true for undefined AND null values
      (key) => pieceVersionData[key] == null && delete pieceVersionData[key],
    );

    const pieceVersionState = getPieceVersionStateFromInput({
      ...pieceVersionData,
      pieceId: selectedPieceId,
    });
    pieceVersionState.isNew = true;
    console.log("New pieceVersion to be stored in state", pieceVersionState);
    onPieceVersionSelect(pieceVersionState);
  };

  const onPieceVersionSelect = (pieceVersion: PieceVersionState) => {
    console.log(`[onPieceVersionSelect] pieceVersion :`, pieceVersion);
    // Add the pieceVersion in feedForm state
    onAddPieceVersion(pieceVersion);

    // Add the pieceVersionId alongSide corresponding pieceId in local state piecePieceVersions list
    setPiecePieceVersions([
      ...piecePieceVersions,
      {
        pieceId: pieces[currentPieceIndex].id,
        pieceVersionId: pieceVersion.id,
      },
    ]);

    // Go to the next piece
    setCurrentPieceIndex(currentPieceIndex + 1);
  };

  return (
    <div>
      {piecePieceVersions.map((ppv) => {
        const piece = pieces.find((p) => p.id === ppv.pieceId);
        // const piece = getEntityByIdOrKey(feedFormState, "pieces", ppv.pieceId);
        return (
          <div key={ppv.pieceId}>
            {`${piece?.title}`}
            <span className="ml-3 text-accent">{`✔`}</span>
          </div>
        );
      })}
      {areAllPieceVersionDefined ? (
        <>
          <div className="my-2">{`All pieces has been defined, you can confirm below.`}</div>
          <button
            className="btn btn-primary"
            onClick={() => onSubmitPiecePieceVersions(piecePieceVersions)}
          >
            {`Confirm adding this collection`}
          </button>
        </>
      ) : (
        <>
          <h2 className="text-2xl text-primary font-bold mb-4">
            {`#${currentPieceIndex + 1}. ${pieces[currentPieceIndex].title}`}
          </h2>
          <PieceVersionSelectOrCreate
            selectedPieceId={pieces[currentPieceIndex]?.id}
            feedFormState={feedFormState}
            onPieceVersionCreated={onPieceVersionCreated}
            onPieceVersionSelect={onPieceVersionSelect}
          />
        </>
      )}
      <DebugBox
        title="Local form state"
        stateObject={piecePieceVersions}
        shouldExpandNode={(level) => level < 3}
      />
    </div>
  );
}
