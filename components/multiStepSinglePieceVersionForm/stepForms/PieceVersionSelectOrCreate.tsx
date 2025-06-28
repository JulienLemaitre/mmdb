import React, { useEffect, useState } from "react";
import { PieceVersionInput, PieceVersionState } from "@/types/formTypes";
import { getNewEntities } from "@/components/context/feedFormContext";
import Loader from "@/components/Loader";
import PieceVersionEditForm from "@/components/entities/piece-version/PieceVersionEditForm";
import PieceVersionSelectForm from "@/components/entities/piece-version/PieceVersionSelectForm";
import { URL_API_GETALL_PIECE_PIECE_VERSIONS } from "@/utils/routes";
import { FeedFormState } from "@/types/feedFormTypes";

type PieceVersionSelectOrCreateProps = {
  feedFormState: FeedFormState;
  selectedPieceId?: string;
  selectedPieceVersionId?: string;
  onPieceVersionCreated: (pieceVersion: PieceVersionInput) => void;
  onPieceVersionSelect: (pieceVersion: PieceVersionState) => void;
  onInitPieceVersionCreation: () => void;
  onCancelPieceVersionCreation: () => void;
  isCollectionMode?: boolean;
  isUpdateMode?: boolean;
  hasPieceJustBeenCreated: boolean;
  hasPieceVersionJustBeenCreated: boolean;
};

function PieceVersionSelectOrCreate({
  selectedPieceId,
  selectedPieceVersionId,
  feedFormState,
  onPieceVersionCreated,
  onPieceVersionSelect,
  onInitPieceVersionCreation: onInitPieceVersionCreationFn,
  onCancelPieceVersionCreation,
  isCollectionMode,
  isUpdateMode,
  hasPieceJustBeenCreated,
  hasPieceVersionJustBeenCreated,
}: PieceVersionSelectOrCreateProps) {
  const isDataFetchDisabled =
    hasPieceJustBeenCreated || hasPieceVersionJustBeenCreated;
  const [existingPieceVersions, setExistingPieceVersions] = useState<
    PieceVersionState[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(!isDataFetchDisabled);

  const newPieceVersions: PieceVersionState[] = getNewEntities(
    feedFormState,
    "pieceVersions",
    { includeUnusedInFeedForm: true },
  ).filter((pieceVersion) => pieceVersion.pieceId === selectedPieceId);
  const newSelectedPieceVersion = newPieceVersions?.find(
    (pieceVersion) => pieceVersion.id === selectedPieceVersionId,
  );
  const isNewPieceVersionUpdate = !!isUpdateMode && !!newSelectedPieceVersion;
  const isCollectionCreation = !!isCollectionMode && !isUpdateMode;
  const [isEditMode, setIsEditMode] = useState(
    isCollectionCreation ||
      hasPieceJustBeenCreated ||
      hasPieceVersionJustBeenCreated ||
      isNewPieceVersionUpdate,
  );
  let pieceVersionFullList = [
    ...(existingPieceVersions || []),
    ...(newPieceVersions || []),
  ];

  const selectedPieceVersion: PieceVersionState | undefined =
    pieceVersionFullList?.find(
      (pieceVersion) => pieceVersion.id === selectedPieceVersionId,
    );

  // Fetch all pieceVersions for selectedPieceId
  // => triggered by isLoading = true
  useEffect(() => {
    if (!isLoading) {
      console.log(
        `[useEffect] DON'T Fetch pieceVersions for selectedPieceId ${selectedPieceId}`,
      );
      return;
    }

    console.log(
      `[useEffect] Fetch pieceVersions for selectedPieceId ${selectedPieceId}`,
    );
    fetch(URL_API_GETALL_PIECE_PIECE_VERSIONS + "?pieceId=" + selectedPieceId, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        const pieceVersions: PieceVersionState[] = data?.pieceVersions;
        if (!pieceVersions?.length) {
          console.log(
            `[PieceVersionSelectOrCreate useEffect] No piece version found for piece ${selectedPieceId}`,
          );
        } else {
          setExistingPieceVersions(pieceVersions);
        }
      })
      .catch((err) => {
        console.log(
          `[fetch("URL_API_GETALL_PIECE_PIECE_VERSIONS?pieceId=${selectedPieceId}")] err :`,
          err,
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isLoading, selectedPieceId]);

  // Set isLoading = true to trigger pieceVersion data fetching on selectedPieceId change
  useEffect(() => {
    if (!isDataFetchDisabled) {
      setIsLoading(true);
    }
  }, [isDataFetchDisabled, selectedPieceId]);

  const onInitPieceVersionCreation = () => {
    onInitPieceVersionCreationFn();
    setIsEditMode(true);
  };

  const onCancelPieceVersionEdition = () => {
    if (hasPieceVersionJustBeenCreated) {
      onCancelPieceVersionCreation();
    }
    setIsLoading(true);
    setIsEditMode(false);
  };

  if (isLoading) return <Loader />;

  if (isEditMode)
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
