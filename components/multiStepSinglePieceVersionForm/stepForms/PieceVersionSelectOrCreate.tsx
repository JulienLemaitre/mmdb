import React, { useEffect, useState } from "react";
import { PieceVersionInput, PieceVersionState } from "@/types/formTypes";
import { getNewEntities } from "@/components/context/feedFormContext";
import Loader from "@/components/Loader";
import PieceVersionEditForm from "@/components/entities/piece-version/PieceVersionEditForm";
import PieceVersionSelectForm from "@/components/entities/piece-version/PieceVersionSelectForm";
import { URL_API_GETALL_PIECE_PIECE_VERSIONS } from "@/utils/routes";
import { FeedFormState } from "@/types/feedFormTypes";
import { SinglePieceVersionFormState } from "@/components/context/SinglePieceVersionFormContext";

type PieceVersionSelectOrCreateProps = {
  feedFormState: FeedFormState;
  singlePieceVersionFormState: SinglePieceVersionFormState;
  selectedPieceId?: string;
  selectedPieceVersionId?: string;
  onPieceVersionCreated: (pieceVersion: PieceVersionInput) => void;
  onPieceVersionSelect: (pieceVersion: PieceVersionState) => void;
  onInitPieceVersionCreation: () => void;
  onCancelPieceVersionCreation: () => void;
  isCollectionCreationMode?: boolean;
};

function PieceVersionSelectOrCreate({
  singlePieceVersionFormState,
  selectedPieceId,
  selectedPieceVersionId,
  feedFormState,
  onPieceVersionCreated,
  onPieceVersionSelect,
  onInitPieceVersionCreation: onInitPieceVersionCreationFn,
  onCancelPieceVersionCreation,
  isCollectionCreationMode,
}: PieceVersionSelectOrCreateProps) {
  const hasComposerJustBeenCreated =
    !!singlePieceVersionFormState.composer?.isNew;
  const hasPieceJustBeenCreated = !!singlePieceVersionFormState.piece?.isNew;
  const hasPieceVersionJustBeenCreated =
    !!singlePieceVersionFormState.pieceVersion?.isNew;
  console.log(
    `[] hasPieceVersionJustBeenCreated :`,
    hasPieceVersionJustBeenCreated,
  );

  const [existingPieceVersions, setExistingPieceVersions] = useState<
    PieceVersionState[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(
    !hasPieceJustBeenCreated && !hasPieceVersionJustBeenCreated,
  );
  const [isCreation, setIsCreation] = useState(
    !!isCollectionCreationMode ||
      hasPieceJustBeenCreated ||
      hasPieceVersionJustBeenCreated,
  );

  const newPieceVersions: PieceVersionState[] = getNewEntities(
    feedFormState,
    "pieceVersions",
    { includeUnusedInFeedForm: true },
  ).filter((pieceVersion) => pieceVersion.pieceId === selectedPieceId);
  const newSelectedPieceVersion = newPieceVersions?.find(
    (pieceVersion) => pieceVersion.id === selectedPieceVersionId,
  );
  // const isPieceVersionSelectedNew = !!newSelectedPieceVersion;
  let pieceVersionFullList = [
    ...(existingPieceVersions || []),
    ...(newPieceVersions || []),
  ];

  const selectedPieceVersion: PieceVersionState | undefined =
    pieceVersionFullList?.find(
      (pieceVersion) => pieceVersion.id === selectedPieceVersionId,
    );

  // If piece has not been created in this singlePieceVersionForm, we fetch all related pieceVersions
  useEffect(() => {
    if (!isLoading) return;

    // If we have created a new piece, we don't fetch anything and set loading to false
    if (hasPieceJustBeenCreated) {
      setIsLoading(false);
      return;
    }

    // If we selected an existing piece, we fetch all its pieceVersions
    if (selectedPieceId) {
      fetch(
        URL_API_GETALL_PIECE_PIECE_VERSIONS + "?pieceId=" + selectedPieceId,
        { cache: "no-store" },
      )
        .then((res) => res.json())
        .then((data) => {
          const pieceVersions: PieceVersionState[] = data?.pieceVersions;
          if (!pieceVersions?.length) {
            console.log(
              `[PieceVersionSelectOrCreate useEffect] No piece version found for piece ${selectedPieceId}`,
            );
            // setIsCreation(true);
            setIsLoading(false);
          } else {
            setExistingPieceVersions(pieceVersions);
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
  }, [isLoading, hasPieceJustBeenCreated, selectedPieceId]);

  const onInitPieceVersionCreation = () => {
    onInitPieceVersionCreationFn();
    setIsCreation(true);
  };

  const onCancelPieceVersionEdition = () => {
    if (hasPieceVersionJustBeenCreated) {
      onCancelPieceVersionCreation();
    }
    setIsLoading(true);
    setIsCreation(false);
  };

  if (isLoading) return <Loader />;

  if (isCreation)
    // if (isCreation || isPieceVersionSelectedNew)
    return (
      <PieceVersionEditForm
        pieceVersion={newSelectedPieceVersion}
        onSubmit={onPieceVersionCreated}
        onCancel={onCancelPieceVersionEdition}
      />
    );

  if (pieceVersionFullList.length === 0)
    return (
      <p>{`Oups, something went wrong with data fetching. Can't continue...`}</p>
    );

  return (
    <PieceVersionSelectForm
      pieceVersions={pieceVersionFullList}
      value={selectedPieceVersion}
      onPieceVersionSelect={onPieceVersionSelect}
      onInitPieceVersionCreation={onInitPieceVersionCreation}
    />
  );
}

export default PieceVersionSelectOrCreate;
