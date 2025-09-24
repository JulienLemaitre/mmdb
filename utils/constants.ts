import { FeedFormState } from "@/types/feedFormTypes";
import getFeedFormTestState from "@/utils/getFeedFormTestState";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
// import getCollectionsPieceVersionsFormTestState from "@/utils/getCollectionsPieceVersionsFormTestState";
import { SinglePieceVersionFormState } from "@/types/singlePieceVersionFormTypes";

export const TEMPO_INDICATION_NONE_ID = "6a16e457-6aeb-4802-a59e-4ce3b91cafa2";
export const ONE_MM_REQUIRED = "At least one metronome mark is required.";
export const MODAL_AREA_ID = "modal-area";
export const NEED_CONFIRMATION_MODAL_ID = "need-confirmation-modal";
export const CONFIRM_RESET_ALL_FORMS_MODAL_ID = "confirm-reset-all-forms-modal";

// localStorage
export const SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY =
  "singlePieceVersionForm";
export const COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY =
  "collectionPieceVersionForm";

// Feed Form

export const FEED_FORM_LOCAL_STORAGE_KEY = "feedForm";
export const FEED_FORM_BOOT_KEY = "feedForm:boot";
// @ts-ignore
export const FEED_FORM_TEST_STATE: FeedFormState = getFeedFormTestState();

export const FEED_FORM_INITIAL_STATE: FeedFormState = {
  // export const FEED_FORM_INITIAL_STATE: FeedFormState = FEED_FORM_TEST_STATE || {
  formInfo: {
    currentStepRank: 0,
  },
  mMSourceDescription: undefined,
  mMSourceContributions: [],
  mMSourcePieceVersions: [],
  collections: [],
  metronomeMarks: [],
  organizations: [],
  persons: [],
  pieces: [],
  pieceVersions: [],
  tempoIndications: [],
};

// Single pieceVersion form

export const SINGLE_PIECE_VERSION_FORM_INITIAL_STATE: SinglePieceVersionFormState =
  {
    formInfo: {
      currentStepRank: 0,
    },
  };

// Collection form

// const COLLECTION_PIECE_VERSION_FORM_TEST_STATE = getCollectionsPieceVersionsFormTestState();
export const COLLECTION_PIECE_VERSION_FORM_INITIAL_STATE: CollectionPieceVersionsFormState =
  // COLLECTION_PIECE_VERSION_FORM_TEST_STATE || {
  {
    formInfo: {
      currentStepRank: 0,
    },
    collection: undefined,
    mMSourcePieceVersions: [],
    persons: [],
    pieces: [],
    pieceVersions: [],
    tempoIndications: [],
  };
