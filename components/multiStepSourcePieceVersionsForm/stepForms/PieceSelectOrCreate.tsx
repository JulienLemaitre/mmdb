import React, { useEffect, useState } from "react";
import {
  updateSourceOnPieceVersionsForm,
  useSourceOnPieceVersionsForm,
} from "@/components/context/SourceOnPieceVersionFormContext";
import { PieceInput, PieceState } from "@/types/formTypes";
import getPieceStateFromInput from "@/utils/getPieceStateFromInput";
import { Piece } from "@prisma/client";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import Loader from "@/components/Loader";
import PieceEditForm from "@/components/entities/piece/PieceEditForm";
import PieceSelectForm from "@/components/entities/piece/PieceSelectForm";
import { URL_API_GETALL_COMPOSER_PIECES } from "@/utils/routes";

function PieceSelectOrCreate() {
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreation, setIsCreation] = useState(false);
  const { dispatch, state } = useSourceOnPieceVersionsForm();
  const { state: feedFormState, dispatch: feedFormDispatch } = useFeedForm();
  const selectedComposerId = state?.composer?.id;
  const selectedPieceId = state?.piece?.id;
  const newPieces = feedFormState.pieces;
  let pieceFullList = [...(pieces || []), ...(newPieces || [])];

  // If we have new pieces, we need to sort the pieceFullList
  if (newPieces?.length) {
    pieceFullList = pieceFullList.sort((a, b) => {
      if (a.title < b.title) return -1;
      if (a.title > b.title) return 1;
      return 0;
    });
  }

  // If composer is newly created, we shift in creation mode directly
  const newPersons = feedFormState.persons;
  const isNewComposer =
    selectedComposerId &&
    newPersons?.some((person) => person.id === selectedComposerId);
  useEffect(() => {
    if (typeof isNewComposer !== "boolean")
      console.log(`[useEffect 1] isNewComposer not boolean:`, isNewComposer);
    if (typeof isNewComposer === "boolean" && isNewComposer) {
      setIsCreation(true);
    }
  }, [isNewComposer]);

  // If composer is not new, we fetch all his composition pieces
  useEffect(() => {
    if (typeof isNewComposer !== "boolean")
      console.log(`[useEffect 2] isNewComposer not boolean:`, isNewComposer);

    // If we selected an existing composer, we fetch all his pieces
    if (typeof isNewComposer === "boolean" && !isNewComposer) {
      fetch(
        URL_API_GETALL_COMPOSER_PIECES + "?composerId=" + selectedComposerId,
        { cache: "no-store" },
      )
        .then((res) => res.json())
        .then((data) => {
          const pieces: Piece[] = data?.pieces;
          if (!pieces?.length) {
            console.log(
              `[useEffect 2] No composition pieces found for composer ${selectedComposerId}`,
            );
            setIsCreation(true);
            setIsLoading(false);
          } else {
            setPieces(data?.pieces);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.log(
            `[fetch("URL_API_GETALL_COMPOSER_PIECES?composerId=${selectedComposerId}")] err :`,
            err,
          );
          setIsLoading(false);
        });
    }

    // If we have created a new composer, we don't fetch anything and set loading to false
    if (typeof isNewComposer === "boolean" && isNewComposer) {
      setIsLoading(false);
    }
  }, [isNewComposer]);

  const onPieceCreated = async (data: PieceInput) => {
    // Front input values validation is successful at this point.
    console.log("[onPieceCreated] data", data);

    const pieceData = data;
    // Remove null values from pieceData
    Object.keys(pieceData).forEach(
      (key) => pieceData[key] == null && delete pieceData[key],
    );

    const composerId = pieceData.composerId || selectedComposerId;
    if (!composerId) {
      console.log(
        "OUPS: No composerId in pieceData or form state to link to the piece",
      );
      // TODO: trigger a toast
      return;
    }

    const pieceState = getPieceStateFromInput({
      ...pieceData,
      composerId,
    });
    pieceState.isNew = true;

    // If a piece is selected AND it is a newly created one present in the form state, we build a deletedIdArray with its id for it to be removed from state
    let deleteIdArray: string[] = [];
    if (
      selectedPieceId &&
      feedFormState.pieces?.some((piece) => piece.id === selectedPieceId)
    ) {
      deleteIdArray = [selectedPieceId];
    }

    updateFeedForm(feedFormDispatch, "pieces", {
      array: [pieceState],
      ...(deleteIdArray.length ? { deleteIdArray } : {}),
    });
    updateSourceOnPieceVersionsForm(dispatch, "piece", {
      value: { id: pieceState.id },
      next: true,
    });
  };

  const onPieceSelect = (piece: PieceInput) => {
    // If a piece is selected AND it is a newly created one present in the form state, we build a deletedIdArray with its id for it to be removed from state
    let deleteIdArray: string[] = [];
    if (
      selectedPieceId &&
      feedFormState.pieces?.some((piece) => piece.id === selectedPieceId)
    ) {
      deleteIdArray = [selectedPieceId];
    }
    if (deleteIdArray.length) {
      updateFeedForm(feedFormDispatch, "pieces", {
        deleteIdArray,
      });
    }

    updateSourceOnPieceVersionsForm(dispatch, "piece", {
      value: {
        id: piece.id,
      },
      next: true,
    });
  };

  const onPieceCreationClick = () => {
    setIsCreation(true);
  };

  if (isLoading) return <Loader />;

  const selectedPiece: PieceState | undefined = pieceFullList?.find(
    (piece) => piece.id === selectedPieceId,
  );

  if (isCreation)
    return (
      <PieceEditForm
        onSubmit={onPieceCreated}
        onCancel={() => setIsCreation(false)}
      />
    );

  if (!pieceFullList)
    return (
      <p>{`Oups, something went wrong with data fetching. Can't continue...`}</p>
    );

  return (
    <PieceSelectForm
      pieces={pieceFullList}
      value={selectedPiece}
      onPieceSelect={onPieceSelect}
      onPieceCreationClick={onPieceCreationClick}
    />
  );
}

export default PieceSelectOrCreate;
