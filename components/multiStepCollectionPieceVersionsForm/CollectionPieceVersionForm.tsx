import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import {
  updateCollectionPieceVersionsForm,
  useCollectionPieceVersionsForm,
} from "@/components/context/CollectionPieceVersionsFormContext";
import {
  CollectionInput,
  CollectionState,
  CollectionTitleInput,
  PersonInput,
  PersonState,
} from "@/types/formTypes";
import getCollectionStateFromInput from "@/utils/getCollectionStateFromInput";
import { getStepByRank } from "@/components/multiStepCollectionPieceVersionsForm/stepsUtils";
import DebugBox from "@/components/DebugBox";
import { v4 as uuidv4 } from "uuid";
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

  ////////////////// COMPOSER ////////////////////

  const onComposerCreated = (composer: PersonInput) => {
    const newComposer: PersonState = {
      ...composer,
      id: composer.id || uuidv4(),
      isNew: true,
    };
    updateFeedForm(feedFormDispatch, "persons", { array: [newComposer] });
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: { composerId: composer.id },
      next: true,
    });
  };
  const onComposerSelect = (composer: PersonInput) => {
    updateFeedForm(feedFormDispatch, "persons", { array: [composer] });
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: { composerId: composer.id },
      next: true,
    });
  };
  const selectedComposerId = state?.collection?.composerId;

  ////////////////// COLLECTION ////////////////////

  const onCollectionCreated = (collection: CollectionTitleInput) => {
    if (!selectedComposerId) {
      console.error("[ERROR] No composer selected for collection creation.");
      return;
    }
    const newCollection: CollectionState = {
      ...collection,
      composerId: selectedComposerId,
      id: collection.id || uuidv4(),
      isNew: true,
    };
    updateFeedForm(feedFormDispatch, "collections", { array: [newCollection] });
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: {
        id: newCollection.id,
        composerId: newCollection.composerId,
        title: newCollection.title,
      },
      next: true,
    });
  };
  const onCollectionSelect = (collection: CollectionInput) => {
    updateFeedForm(feedFormDispatch, "collections", { array: [collection] });
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: {
        id: collection.id,
        composerId: collection.composerId,
        title: collection.title,
      },
      next: true,
    });
  };
  const selectedCollectionId = state?.collection?.id;

  ////////////////// COLLECTION PIECE VERSIONS ////////////////////

  const onAddSourceOnPieceVersion = (payload) => {
    updateCollectionPieceVersionsForm(
      dispatch,
      "mMSourcePieceVersions",
      payload,
    );
  };

  const onCollectionSubmit = (data: CollectionInput) => {
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
          feedFormState={feedFormState}
          selectedComposerId={selectedComposerId}
          selectedCollectionId={selectedCollectionId}
          onSubmit={onSubmit}
          onComposerSelect={onComposerSelect}
          onComposerCreated={onComposerCreated}
          onCollectionSelect={onCollectionSelect}
          onCollectionCreated={onCollectionCreated}
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
