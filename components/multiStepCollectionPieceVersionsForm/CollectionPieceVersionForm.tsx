import React from "react";
import ArrowLeftIcon from "@/components/svg/ArrowLeftIcon";

type CollectionPieceVersionFormProps = {
  onFormClose: () => void;
};

function CollectionPieceVersionForm({
  onFormClose,
}: CollectionPieceVersionFormProps) {
  return (
    <div>
      <div>Coming soon</div>
      <button className="btn btn-neutral" type="button" onClick={onFormClose}>
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back
      </button>
    </div>
  );
}

export default CollectionPieceVersionForm;
