import { useFeedForm } from "@/components/context/feedFormContext";
import {
  updateCollectionPieceVersionsForm,
  useCollectionPieceVersionsForm,
} from "@/components/context/CollectionPieceVersionsFormContext";
import { CollectionInput } from "@/types/formTypes";
import getCollectionStateFromInput from "@/utils/getCollectionStateFromInput";
import { getStepByRank } from "@/components/multiStepCollectionPieceVersionsForm/stepsUtils";
import DebugBox from "@/components/DebugBox";
import CollectionPieceVersionsSteps from "@/components/multiStepCollectionPieceVersionsForm/CollectionPieceVersionsSteps";

type CollectionPieceVersionFormProps = {
  onFormClose: () => void;
  onSubmit?: (payload: any) => void;
};

function CollectionPieceVersionForm({
  onFormClose,
  onSubmit,
}: CollectionPieceVersionFormProps) {
  const { dispatch: feedFormDispatch, state: feedFormState } = useFeedForm();
  const { dispatch, state, currentStepRank } = useCollectionPieceVersionsForm();
  const currentStep = getStepByRank({ state, rank: currentStepRank });
  const StepFormComponent = currentStep.Component;

  const onAddSourceOnPieceVersion = async (payload) => {
    updateCollectionPieceVersionsForm(
      dispatch,
      "mMSourcePieceVersions",
      payload,
    );
  };

  const onCollectionSubmit = async (data: CollectionInput) => {
    // Front input values validation is successful at this point.
    console.log("data", data);
    const collectionData = data;
    // Remove null values from collectionData
    Object.keys(collectionData).forEach(
      // '== null' is true for undefined AND null values
      (key) => collectionData[key] == null && delete collectionData[key],
    );
    const collectionState = getCollectionStateFromInput({ ...collectionData });
    collectionState.isNew = true;
    console.log("collection to be stored in collection state", collectionState);
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: collectionState,
    });
  };

  return (
    <div>
      <CollectionPieceVersionsSteps />
      {StepFormComponent ? (
        <StepFormComponent
          onFormClose={onFormClose}
          state={state}
          onSubmit={onSubmit}
        />
      ) : (
        <div>Nothing to show...</div>
      )}
      <DebugBox stateObject={state} />
    </div>
  );
}
// <h1 className="mb-4 text-4xl font-bold">
//   Complete Collection
//   <span className="block text-xl font-normal">of Pieces</span>
// </h1>
// <button className="btn btn-neutral" type="button" onClick={onFormClose}>
//   <ArrowLeftIcon className="w-5 h-5 mr-2" />
//   Back
// </button>

// {!isCollectionRegistered && (
//   <CollectionEditForm
//     onSubmit={onCollectionSubmit}
//     submitTitle="collection info"
//   />
// )}
// {isCollectionRegistered && (
//   <button
//     className="btn btn-primary"
//     type="button"
//     onClick={() => setIsPieceVersionFormOpen(true)}
//   >
//     Add a piece
//   </button>
// )}
// {isPieceVersionFormOpen && (
//   <SinglePieceVersionFormProvider>
//     <SinglePieceVersionForm
//       onFormClose={() => setIsPieceVersionFormOpen(false)}
//       onSubmit={onAddSourceOnPieceVersion}
//       initPayload={{
//         composer: {},
//       }}
//     />
//   </SinglePieceVersionFormProvider>
// )}

export default CollectionPieceVersionForm;
