import { FeedFormState } from "@/types/feedFormTypes";
import { isEntityUsed } from "@/components/context/feedFormContext";

/**
 * Cleans the given FeedFormState object by filtering out any entity that is not in use anymore.
 *
 * @param {FeedFormState} state - The current state to be cleaned and filtered.
 * @return {FeedFormState} The new state object with filtered attributes.
 */
export function cleanFeedFormState(state: FeedFormState): FeedFormState {
  const newState = {
    ...state,
    collections: (state.collections || []).filter((c) =>
      isEntityUsed(c, "collections", state),
    ),
    metronomeMarks: (state.metronomeMarks || []).filter((mm) =>
      isEntityUsed(mm, "metronomeMarks", state),
    ),
    organizations: (state.organizations || []).filter((o) =>
      isEntityUsed(o, "organizations", state),
    ),
    persons: (state.persons || []).filter((p) =>
      isEntityUsed(p, "persons", state),
    ),
    pieces: (state.pieces || []).filter((p) =>
      isEntityUsed(p, "pieces", state),
    ),
    pieceVersions: (state.pieceVersions || []).filter((pv) =>
      isEntityUsed(pv, "pieceVersions", state),
    ),
    tempoIndications: (state.tempoIndications || []).filter((ti) =>
      isEntityUsed(ti, "tempoIndications", state),
    ),
  };

  // console.log("cleanFeedFormState", {
  //   ...(state.collections?.length !== newState.collections?.length
  //     ? {
  //         collections:
  //           (newState.collections || []).length -
  //           (state.collections || []).length,
  //       }
  //     : {}),
  //   ...(state.metronomeMarks?.length !== newState.metronomeMarks?.length
  //     ? {
  //         metronomeMarks:
  //           (newState.metronomeMarks || []).length -
  //           (state.metronomeMarks || []).length,
  //       }
  //     : {}),
  //   ...(state.organizations?.length !== newState.organizations?.length
  //     ? {
  //         organizations:
  //           (newState.organizations || []).length -
  //           (state.organizations || []).length,
  //       }
  //     : {}),
  //   ...(state.persons?.length !== newState.persons?.length
  //     ? {
  //         persons:
  //           (newState.persons || []).length - (state.persons || []).length,
  //       }
  //     : {}),
  //   ...(state.pieces?.length !== newState.pieces?.length
  //     ? {
  //         pieces: (newState.pieces || []).length - (state.pieces || []).length,
  //       }
  //     : {}),
  //   ...(state.pieceVersions?.length !== newState.pieceVersions?.length
  //     ? {
  //         pieceVersions:
  //           (newState.pieceVersions || []).length -
  //           (state.pieceVersions || []).length,
  //       }
  //     : {}),
  //   ...(state.tempoIndications?.length !== newState.tempoIndications?.length
  //     ? {
  //         tempoIndications:
  //           (newState.tempoIndications || []).length -
  //           (state.tempoIndications || []).length,
  //       }
  //     : {}),
  // });

  return newState;
}
