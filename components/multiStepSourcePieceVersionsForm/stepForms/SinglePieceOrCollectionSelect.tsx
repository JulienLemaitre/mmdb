import React from "react";
import {
  updateSourceOnPieceVersionsForm,
  useSourceOnPieceVersionsForm,
} from "@/components/context/SourceOnPieceVersionFormContext";

const SinglePieceOrCollectionSelect = () => {
  const { dispatch } = useSourceOnPieceVersionsForm();

  const onPieceTypeSelect = ({ isCollection }: { isCollection: boolean }) => {
    updateSourceOnPieceVersionsForm(dispatch, "formInfo", {
      value: { isCollection },
      next: true,
    });
  };

  return (
    <div>
      <p>You will describe your source of Metronome Mark Piece by piece.</p>
      <p>
        But if it contains a complete <i>collection</i> of pieces, like a
        complete opus, choose the corresponding option below and you will be
        guided to describe this collection.
      </p>
      <div className="flex gap-4">
        {/*<div className="w-1/2">*/}
        <div
          className={`btn btn-primary`}
          onClick={() => onPieceTypeSelect({ isCollection: false })}
        >
          {`Add a single piece`}
        </div>
        {/*</div>*/}
        {/*<div className="w-1/2">*/}
        <div
          className={`btn btn-primary`}
          onClick={() => onPieceTypeSelect({ isCollection: true })}
        >
          {`Add a complete collection`}
        </div>
        {/*</div>*/}
      </div>
    </div>
  );
};

export default SinglePieceOrCollectionSelect;
