import React, { useState } from "react";
import {
  updateCollectionPieceVersionsForm,
  useCollectionPieceVersionsForm,
} from "@/components/context/CollectionPieceVersionsFormContext";
import {
  getEntityByIdOrKey,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { SinglePieceVersionFormProvider } from "@/components/context/SinglePieceVersionFormContext";
import SinglePieceVersionForm from "@/components/multiStepSinglePieceVersionForm/SinglePieceVersionForm";
import getPersonName from "@/components/entities/person/utils/getPersonName";
import TrashIcon from "@/components/svg/TrashIcon";
import PlusIcon from "@/components/svg/PlusIcon";
import { MMSourcePieceVersionsState } from "@/types/formTypes";

type CollectionPieceVersionsEditFormProps = {
  onSubmitSourceOnPieceVersions: (
    piecePieceVersions: MMSourcePieceVersionsState[],
  ) => void;
};

function CollectionPieceVersionsEditForm({
  onSubmitSourceOnPieceVersions,
}: CollectionPieceVersionsEditFormProps) {
  const { state: feedFormState } = useFeedForm();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { state, dispatch } = useCollectionPieceVersionsForm();
  const collectionPieceVersions = state.mMSourcePieceVersions || [];

  const onDeletePieceVersionId = (pieceVersionId) => {
    updateCollectionPieceVersionsForm(dispatch, "mMSourcePieceVersions", {
      deleteIdArray: [pieceVersionId],
      idKey: "pieceVersionId",
    });
    // Delete new PieceVersion as well if exists
    updateCollectionPieceVersionsForm(dispatch, "pieceVersions", {
      deleteIdArray: [pieceVersionId],
    });
  };

  const onSubmit = () => {
    // Transfer from collection form to feed form
    onSubmitSourceOnPieceVersions(collectionPieceVersions);
    setIsFormOpen(false);
  };
  const onSinglePieceSubmit = (payload: any) => {
    console.log(`[onSinglePieceSubmit] payload :`, payload);
    updateCollectionPieceVersionsForm(
      dispatch,
      "mMSourcePieceVersions",
      payload,
    );
  };

  return (
    <>
      {isFormOpen ? (
        <SinglePieceVersionFormProvider>
          <SinglePieceVersionForm
            onFormClose={() => setIsFormOpen(false)}
            onSubmit={onSinglePieceSubmit}
            isCollectionCreationMode={true}
            composerId={state?.collection?.composerId}
          />
        </SinglePieceVersionFormProvider>
      ) : (
        <>
          <ul className="my-4 max-w-[65ch]">
            {collectionPieceVersions.map((sourcePieceVersion, index) => {
              const pieceVersion = getEntityByIdOrKey(
                feedFormState,
                "pieceVersions",
                sourcePieceVersion.pieceVersionId,
              );
              const piece = getEntityByIdOrKey(
                feedFormState,
                "pieces",
                pieceVersion.pieceId,
              );
              const composer = getEntityByIdOrKey(
                feedFormState,
                "persons",
                piece.composerId,
              );
              console.log({ piece, composer });

              return (
                <li
                  key={`${index}-${sourcePieceVersion.pieceVersionId}-${sourcePieceVersion.rank}`}
                >
                  <div className="mt-6 flex gap-4 items-end w-full">
                    <div className="flex-grow">
                      <h4 className="text-lg font-bold text-secondary">
                        {`${sourcePieceVersion.rank} - ${piece.title}${!!composer && ` | ${getPersonName(composer)}`}`}
                      </h4>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="btn btn-sm btn-neutral hover:btn-error"
                        onClick={() =>
                          onDeletePieceVersionId(
                            sourcePieceVersion.pieceVersionId,
                          )
                        }
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex gap-4 items-center mt-6">
            <button
              className="btn btn-accent"
              type="button"
              onClick={() => setIsFormOpen(true)}
            >
              <PlusIcon className="w-5 h-5" />
              Add a single piece
            </button>
          </div>
          {collectionPieceVersions.length > 1 && (
            <div className="flex gap-4 items-center mt-6">
              <button
                className="btn btn-primary"
                type="button"
                onClick={onSubmit}
              >
                Submit (all pieces added)
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default CollectionPieceVersionsEditForm;
