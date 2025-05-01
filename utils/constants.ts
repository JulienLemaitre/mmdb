import { FeedFormState } from "@/types/feedFormTypes";
import getFeedFormTestState from "@/utils/getFeedFormTestState";

export const TEMPO_INDICATION_NONE_ID = "6a16e457-6aeb-4802-a59e-4ce3b91cafa2";
export const ONE_MM_REQUIRED = "At least one metronome mark is required.";
export const MODAL_AREA_ID = "modal-area";

// Feed Form

export const FEED_FORM_LOCAL_STORAGE_KEY = "feedForm";
// @ts-ignore
const TEST_STATE: FeedFormState | null = getFeedFormTestState();

export const FEED_FORM_INITIAL_STATE: FeedFormState = {
  // export const FEED_FORM_INITIAL_STATE: FeedFormState = TEST_STATE || {
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
