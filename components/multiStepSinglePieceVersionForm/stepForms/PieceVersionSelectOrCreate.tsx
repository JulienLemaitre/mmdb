import React, { useEffect, useState } from "react";
import { PieceVersionInput, PieceVersionState } from "@/types/formTypes";
import {
  FeedFormState,
  getNewEntities,
} from "@/components/context/feedFormContext";
import Loader from "@/components/Loader";
import PieceVersionEditForm from "@/components/entities/piece-version/PieceVersionEditForm";
import PieceVersionSelectForm from "@/components/entities/piece-version/PieceVersionSelectForm";
import { URL_API_GETALL_PIECE_PIECE_VERSIONS } from "@/utils/routes";

type PieceVersionSelectOrCreateProps = {
  selectedPieceId?: string;
  selectedPieceVersionId?: string;
  feedFormState: FeedFormState;
  onPieceVersionCreated: (pieceVersion: PieceVersionInput) => void;
  onPieceVersionSelect: (pieceVersion: PieceVersionState) => void;
  deleteSelectedPieceVersionIfNew?: () => void;
};

function PieceVersionSelectOrCreate({
  selectedPieceId,
  selectedPieceVersionId,
  feedFormState,
  onPieceVersionCreated,
  onPieceVersionSelect,
  deleteSelectedPieceVersionIfNew,
}: PieceVersionSelectOrCreateProps) {
  const [pieceVersions, setPieceVersions] = useState<
    PieceVersionState[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreation, setIsCreation] = useState(false);

  const newPieces = getNewEntities(feedFormState, "pieces");
  const newPieceVersions: PieceVersionState[] = getNewEntities(
    feedFormState,
    "pieceVersions",
  ).filter((pieceVersion) => pieceVersion.pieceId === selectedPieceId);
  const newSelectedPieceVersion = newPieceVersions?.find(
    (pieceVersion) => pieceVersion.id === selectedPieceVersionId,
  );
  const isPieceVersionSelectedNew = !!newSelectedPieceVersion;
  let pieceVersionFullList = [
    ...(pieceVersions || []),
    ...(newPieceVersions || []),
  ];

  const selectedPieceVersion: PieceVersionState | undefined =
    pieceVersionFullList?.find(
      (pieceVersion) => pieceVersion.id === selectedPieceVersionId,
    );

  // If piece is newly created, we shift in creation mode directly
  const isNewPiece =
    selectedPieceId && newPieces?.some((piece) => piece.id === selectedPieceId);
  useEffect(() => {
    if (typeof isNewPiece !== "boolean")
      console.log(`[useEffect 1] isNewComposer not boolean:`, isNewPiece);
    if (typeof isNewPiece === "boolean" && isNewPiece) {
      setIsCreation(true);
    }
  }, [isNewPiece]);

  // If piece is not new, we fetch all related pieceVersions
  useEffect(() => {
    if (typeof isNewPiece !== "boolean")
      console.log(`[useEffect 2] isNewComposer not boolean:`, isNewPiece);

    // If we selected an existing piece, we fetch all its pieceVersions
    if (typeof isNewPiece === "boolean" && !isNewPiece) {
      setIsLoading(true);
      fetch(
        URL_API_GETALL_PIECE_PIECE_VERSIONS + "?pieceId=" + selectedPieceId,
        { cache: "no-store" },
      )
        .then((res) => res.json())
        .then((data) => {
          const pieceVersions: PieceVersionState[] = data?.pieceVersions;
          if (!pieceVersions?.length) {
            console.log(
              `[useEffect 2] No piece version found for piece ${selectedPieceId}`,
            );
            setIsCreation(true);
            setIsLoading(false);
          } else {
            setPieceVersions(pieceVersions);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.log(
            `[fetch("URL_API_GETALL_PIECE_PIECE_VERSIONS?pieceId=${selectedPieceId}")] err :`,
            err,
          );
          setIsLoading(false);
        });
    }

    // If we have created a new piece, we don't fetch anything and set loading to false
    if (typeof isNewPiece === "boolean" && isNewPiece) {
      setIsLoading(false);
    }
  }, [isNewPiece, selectedPieceId]);

  const onPieceVersionCreationClick = () => {
    setIsCreation(true);
  };

  const onCancelPieceCreation = () => {
    if (typeof deleteSelectedPieceVersionIfNew === "function") {
      deleteSelectedPieceVersionIfNew();
    }
    setIsCreation(false);
  };

  if (isLoading) return <Loader />;

  if (isCreation || isPieceVersionSelectedNew)
    return (
      <PieceVersionEditForm
        pieceVersion={newSelectedPieceVersion}
        onSubmit={onPieceVersionCreated}
        onCancel={onCancelPieceCreation}
      />
    );

  if (!pieceVersions)
    return (
      <p>{`Oups, something went wrong with data fetching. Can't continue...`}</p>
    );

  return (
    <PieceVersionSelectForm
      pieceVersions={pieceVersionFullList}
      value={selectedPieceVersion}
      onPieceVersionSelect={onPieceVersionSelect}
      onPieceVersionCreationClick={onPieceVersionCreationClick}
    />
  );
}

export default PieceVersionSelectOrCreate;
