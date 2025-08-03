import React from "react";
import { getEntityByIdOrKey } from "@/components/context/feedFormContext";
import PieceVersionDisplay from "@/components/entities/piece-version/PieceVersionDisplay";
import getPersonName from "@/components/entities/person/utils/getPersonName";
import { FeedFormState } from "@/types/feedFormTypes";
import formatToPhraseCase from "@/utils/formatToPhraseCase";

type SummaryProps = {
  feedFormState: FeedFormState;
  onSubmitSourceOnPieceVersions: () => void;
  selectedComposerId: string;
  selectedPieceId: string;
  selectedPieceVersionId: string;
  isUpdateMode?: boolean;
};

function Summary({
  feedFormState,
  onSubmitSourceOnPieceVersions,
  selectedComposerId,
  selectedPieceId,
  selectedPieceVersionId,
  isUpdateMode,
}: SummaryProps) {
  const composer = getEntityByIdOrKey(
    feedFormState,
    "persons",
    selectedComposerId,
  );
  const piece = getEntityByIdOrKey(feedFormState, "pieces", selectedPieceId);
  const pieceVersion = getEntityByIdOrKey(
    feedFormState,
    "pieceVersions",
    selectedPieceVersionId,
  );

  return (
    <div>
      <ul className="space-y-6">
        <li className="border border-base-300 rounded-lg hover:border-base-400 hover:shadow-md hover:bg-primary/5 transition-all duration-150">
          <div className="rounded-lg border-l-2 border-l-accent/10 hover:border-l-accent transition-all duration-150">
            {/* Piece Header */}
            <div className="px-4 py-3 bg-accent/10 border-b border-accent/20">
              <div className="flex gap-4 items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-accent">
                    {piece ? piece.title : "- Piece not found -"}
                    {piece && ` (${piece.yearOfComposition || "no date"})`}
                    <span className="text-base font-normal">
                      {composer && ` - ${getPersonName(composer)}`}
                    </span>
                  </h3>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="py-2">
              <div className="px-4 py-3">
                {pieceVersion ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-l-2 border-l-secondary/10 hover:border-l-secondary bg-secondary/5 transition-all duration-150 p-4 rounded-lg">
                      <h5 className="text-sm font-bold text-secondary mb-3">
                        Piece Details
                      </h5>
                      <PieceVersionDisplay pieceVersion={pieceVersion} />
                    </div>
                    <div className="border-l-2 border-l-primary/10 hover:border-l-primary bg-primary/5 transition-all duration-150 p-4 rounded-lg">
                      <h5 className="text-sm font-bold text-primary mb-3">
                        Performance Details
                      </h5>
                      <div className="text-sm">
                        <div>
                          Category:{" "}
                          {pieceVersion &&
                            formatToPhraseCase(pieceVersion.category)}
                        </div>
                        {/* Add more performance details here if needed */}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">{`- Piece Version not found -`}</div>
                )}

                <button
                  onClick={onSubmitSourceOnPieceVersions}
                  className="btn btn-primary mt-6 w-full"
                >
                  {`Confirm ${isUpdateMode ? `your changes` : `adding this piece`}`}
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
}

export default Summary;
