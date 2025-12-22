import React, { useEffect, useState } from "react";
import { PieceVersionInput, PieceVersionState } from "@/types/formTypes";
import { getNewEntities } from "@/context/feedFormContext";
import Loader from "@/ui/Loader";
import PieceVersionEditForm from "@/features/pieceVersion/PieceVersionEditForm";
import PieceVersionSelectForm from "@/features/pieceVersion/PieceVersionSelectForm";
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

  // TRACKING STATE: Keeps track of which ID corresponds to the currently loaded data
  const [fetchedPieceId, setFetchedPieceId] = useState<string | null>(null);

  // DERIVED STATE: We are loading if we have an ID to fetch, fetching isn't disabled,
  // and the data we have in memory doesn't match the selected ID.
  const isLoading =
    !isDataFetchDisabled &&
    !!selectedPieceId &&
    fetchedPieceId !== selectedPieceId;

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
  // Consolidated Effect: Only fetches data. Does not manage "start loading" state.
  useEffect(() => {
    // Only proceed if the derived isLoading is true
    if (!isLoading || !selectedPieceId) {
      return;
    }

    let isMounted = true;
    console.log(
      `[useEffect] Fetch pieceVersions for selectedPieceId ${selectedPieceId}`,
    );

    fetch(URL_API_GETALL_PIECE_PIECE_VERSIONS + "?pieceId=" + selectedPieceId, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          const pieceVersions: PieceVersionState[] = data?.pieceVersions;
          setExistingPieceVersions(pieceVersions || []);
          if ((pieceVersions || [])?.length === 0) {
            console.log(
              `[PieceVersionSelectOrCreate useEffect] No pieceVersions found for pieceId ${selectedPieceId} => SWITCH to edition mode.`,
            );
            setIsEditMode(true);
          }
          // Mark this ID as successfully fetched. This implicitly sets isLoading to false.
          setFetchedPieceId(selectedPieceId);
        }
      })
      .catch((err) => {
        console.log(
          `[fetch("URL_API_GETALL_PIECE_PIECE_VERSIONS?pieceId=${selectedPieceId}")] err :`,
          err,
        );
        if (isMounted) {
          // On error, we technically "finished" attempting to fetch this ID
          setExistingPieceVersions([]);
          setFetchedPieceId(selectedPieceId);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isLoading, selectedPieceId]);

  const onInitPieceVersionCreation = () => {
    onInitPieceVersionCreationFn();
    setIsEditMode(true);
  };

  const onCancelPieceVersionEdition = () => {
    if (hasPieceVersionJustBeenCreated) {
      onCancelPieceVersionCreation();
    }
    // Force a re-fetch (refresh) by resetting the tracking ID.
    // This makes (null !== selectedPieceId) true, causing isLoading to become true.
    setFetchedPieceId(null);
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
