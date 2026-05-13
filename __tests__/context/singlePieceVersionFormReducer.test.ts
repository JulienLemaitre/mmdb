import { singlePieceVersionFormReducerCore } from "@/context/singlePieceVersionFormReducer";
import { SINGLE_PIECE_VERSION_FORM_INITIAL_STATE } from "@/utils/constants";
import { PersonState, PieceState, PieceVersionState } from "@/types/formTypes";

jest.mock(
  "@/features/feed/multiStepSinglePieceVersionForm/stepForms/ComposerSelectOrCreate",
  () => () => null,
);
jest.mock(
  "@/features/feed/multiStepSinglePieceVersionForm/stepForms/PieceSelectOrCreate",
  () => () => null,
);
jest.mock(
  "@/features/feed/multiStepSinglePieceVersionForm/stepForms/PieceVersionSelectOrCreate",
  () => () => null,
);
jest.mock(
  "@/features/feed/multiStepSinglePieceVersionForm/stepForms/Summary",
  () => () => null,
);

describe("singlePieceVersionFormReducerCore", () => {
  const initialState = SINGLE_PIECE_VERSION_FORM_INITIAL_STATE;

  const mockComposer: PersonState = {
    id: "composer-1",
    firstName: "Ludwig van",
    lastName: "Beethoven",
    birthYear: 1770,
    deathYear: 1827,
  };

  const mockPiece: PieceState = {
    id: "piece-1",
    title: "Symphony No. 5",
    composerId: "composer-1",
  };

  const mockPieceVersion: PieceVersionState = {
    id: "version-1",
    pieceId: "piece-1",
    category: "ORCHESTRAL",
    movements: [],
  };

  it("should return initial state when action type is init and no payload", () => {
    const action = { type: "init" as const };
    const state = singlePieceVersionFormReducerCore(initialState, action);
    expect(state).toEqual(initialState);
  });

  it("should return payload when action type is init with payload", () => {
    const payload = {
      formInfo: { currentStepRank: 2 },
      composer: mockComposer,
    };
    const action = { type: "init" as const, payload };
    const state = singlePieceVersionFormReducerCore(initialState, action);
    expect(state).toEqual(payload);
  });

  it("should decrement currentStepRank on goToPrevStep", () => {
    const stateWithStep = {
      ...initialState,
      formInfo: { ...initialState.formInfo, currentStepRank: 2 },
    };
    const action = { type: "goToPrevStep" as const };
    const state = singlePieceVersionFormReducerCore(stateWithStep, action);
    expect(state.formInfo.currentStepRank).toBe(1);
  });

  it("should set currentStepRank on goToStep", () => {
    const action = { type: "goToStep" as const, payload: { stepRank: 3 } };
    const state = singlePieceVersionFormReducerCore(initialState, action);
    expect(state.formInfo.currentStepRank).toBe(3);
  });

  it("should stay at 0 on goToPrevStep if already 0", () => {
    const stateAtZero = {
      ...initialState,
      formInfo: { ...initialState.formInfo, currentStepRank: 0 },
    };
    const action = { type: "goToPrevStep" as const };
    const state = singlePieceVersionFormReducerCore(stateAtZero, action);
    expect(state.formInfo.currentStepRank).toBe(0);
  });

  it("should preserve other formInfo fields during navigation", () => {
    const initialFormInfo = {
      currentStepRank: 1,
      allSourceOnPieceVersionsDone: true,
      mMSourceOnPieceVersionRank: 5,
    };
    const stateWithMoreInfo = {
      ...initialState,
      formInfo: initialFormInfo,
    };
    const action = { type: "goToPrevStep" as const };
    const state = singlePieceVersionFormReducerCore(stateWithMoreInfo, action);
    expect(state.formInfo.currentStepRank).toBe(0);
    expect(state.formInfo.allSourceOnPieceVersionsDone).toBe(true);
    expect(state.formInfo.mMSourceOnPieceVersionRank).toBe(5);
  });

  describe("composer action", () => {
    it("should set composer", () => {
      const action = {
        type: "composer" as const,
        payload: { value: mockComposer },
      };
      const state = singlePieceVersionFormReducerCore(initialState, action);
      expect(state.composer).toEqual(mockComposer);
    });

    it("should increment currentStepRank if next is true and step is complete", () => {
      const action = {
        type: "composer" as const,
        payload: { value: mockComposer, next: true },
      };
      const state = singlePieceVersionFormReducerCore(initialState, action);
      expect(state.composer).toEqual(mockComposer);
      expect(state.formInfo.currentStepRank).toBe(1);
    });

    it("should NOT increment currentStepRank if next is true but step is NOT complete", () => {
      const action = {
        type: "composer" as const,
        payload: { value: { ...mockComposer, id: "" }, next: true },
      };
      const state = singlePieceVersionFormReducerCore(initialState, action);
      expect(state.formInfo.currentStepRank).toBe(0);
    });

    it("should clear piece and pieceVersion if composer is set to undefined", () => {
      const stateWithEntities = {
        ...initialState,
        composer: mockComposer,
        piece: mockPiece,
        pieceVersion: mockPieceVersion,
      };
      const action = {
        type: "composer" as const,
        payload: { value: undefined },
      };
      const state = singlePieceVersionFormReducerCore(
        stateWithEntities,
        action,
      );
      expect(state.composer).toBeUndefined();
      expect(state.piece).toBeUndefined();
      expect(state.pieceVersion).toBeUndefined();
    });

    it("should clear piece and pieceVersion if composer id changes", () => {
      const stateWithEntities = {
        ...initialState,
        composer: mockComposer,
        piece: mockPiece,
        pieceVersion: mockPieceVersion,
      };
      const newComposer = { ...mockComposer, id: "composer-2" };
      const action = {
        type: "composer" as const,
        payload: { value: newComposer },
      };
      const state = singlePieceVersionFormReducerCore(
        stateWithEntities,
        action,
      );
      expect(state.composer).toEqual(newComposer);
      expect(state.piece).toBeUndefined();
      expect(state.pieceVersion).toBeUndefined();
    });

    it("should NOT clear piece and pieceVersion if composer id remains the same", () => {
      const stateWithEntities = {
        ...initialState,
        composer: mockComposer,
        piece: mockPiece,
        pieceVersion: mockPieceVersion,
      };
      const updatedComposer = { ...mockComposer, firstName: "Ludwig" };
      const action = {
        type: "composer" as const,
        payload: { value: updatedComposer },
      };
      const state = singlePieceVersionFormReducerCore(
        stateWithEntities,
        action,
      );
      expect(state.composer).toEqual(updatedComposer);
      expect(state.piece).toEqual(mockPiece);
      expect(state.pieceVersion).toEqual(mockPieceVersion);
    });
  });

  describe("piece action", () => {
    const initialStateWithComposer = {
      ...initialState,
      composer: mockComposer,
      formInfo: { ...initialState.formInfo, currentStepRank: 1 },
    };

    it("should set piece", () => {
      const action = { type: "piece" as const, payload: { value: mockPiece } };
      const state = singlePieceVersionFormReducerCore(
        initialStateWithComposer,
        action,
      );
      expect(state.piece).toEqual(mockPiece);
    });

    it("should increment currentStepRank if next is true and step is complete", () => {
      const action = {
        type: "piece" as const,
        payload: { value: mockPiece, next: true },
      };
      const state = singlePieceVersionFormReducerCore(
        initialStateWithComposer,
        action,
      );
      expect(state.piece).toEqual(mockPiece);
      expect(state.formInfo.currentStepRank).toBe(2);
    });

    it("should clear pieceVersion if piece is set to undefined", () => {
      const stateWithEntities = {
        ...initialStateWithComposer,
        piece: mockPiece,
        pieceVersion: mockPieceVersion,
      };
      const action = { type: "piece" as const, payload: { value: undefined } };
      const state = singlePieceVersionFormReducerCore(
        stateWithEntities,
        action,
      );
      expect(state.piece).toBeUndefined();
      expect(state.pieceVersion).toBeUndefined();
    });

    it("should clear pieceVersion if piece id changes", () => {
      const stateWithEntities = {
        ...initialStateWithComposer,
        piece: mockPiece,
        pieceVersion: mockPieceVersion,
      };
      const newPiece = { ...mockPiece, id: "piece-2" };
      const action = { type: "piece" as const, payload: { value: newPiece } };
      const state = singlePieceVersionFormReducerCore(
        stateWithEntities,
        action,
      );
      expect(state.piece).toEqual(newPiece);
      expect(state.pieceVersion).toBeUndefined();
    });

    it("should NOT clear pieceVersion if piece id remains the same", () => {
      const stateWithEntities = {
        ...initialStateWithComposer,
        piece: mockPiece,
        pieceVersion: mockPieceVersion,
      };
      const updatedPiece = { ...mockPiece, title: "Symphony No. 6" };
      const action = {
        type: "piece" as const,
        payload: { value: updatedPiece },
      };
      const state = singlePieceVersionFormReducerCore(
        stateWithEntities,
        action,
      );
      expect(state.piece).toEqual(updatedPiece);
      expect(state.pieceVersion).toEqual(mockPieceVersion);
    });

    it("should warn if piece.composerId is incoherent with composer.id", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const incoherentPiece = { ...mockPiece, composerId: "other-composer" };
      const action = {
        type: "piece" as const,
        payload: { value: incoherentPiece },
      };
      singlePieceVersionFormReducerCore(initialStateWithComposer, action);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Incoherent piece.composerId detected"),
        expect.any(Object),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("pieceVersion action", () => {
    const initialStateWithPiece = {
      ...initialState,
      composer: mockComposer,
      piece: mockPiece,
      formInfo: { ...initialState.formInfo, currentStepRank: 2 },
    };

    it("should set pieceVersion", () => {
      const action = {
        type: "pieceVersion" as const,
        payload: { value: mockPieceVersion },
      };
      const state = singlePieceVersionFormReducerCore(
        initialStateWithPiece,
        action,
      );
      expect(state.pieceVersion).toEqual(mockPieceVersion);
    });

    it("should increment currentStepRank if next is true and step is complete", () => {
      const action = {
        type: "pieceVersion" as const,
        payload: { value: mockPieceVersion, next: true },
      };
      const state = singlePieceVersionFormReducerCore(
        initialStateWithPiece,
        action,
      );
      expect(state.pieceVersion).toEqual(mockPieceVersion);
      expect(state.formInfo.currentStepRank).toBe(3);
    });

    it("should clear pieceVersion if set to undefined", () => {
      const stateWithEntities = {
        ...initialStateWithPiece,
        pieceVersion: mockPieceVersion,
      };
      const action = {
        type: "pieceVersion" as const,
        payload: { value: undefined },
      };
      const state = singlePieceVersionFormReducerCore(
        stateWithEntities,
        action,
      );
      expect(state.pieceVersion).toBeUndefined();
    });

    it("should warn if pieceVersion.pieceId is incoherent with piece.id", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const incoherentVersion = { ...mockPieceVersion, pieceId: "other-piece" };
      const action = {
        type: "pieceVersion" as const,
        payload: { value: incoherentVersion },
      };
      singlePieceVersionFormReducerCore(initialStateWithPiece, action);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Incoherent pieceVersion.pieceId detected"),
        expect.any(Object),
      );
      consoleSpy.mockRestore();
    });
  });

  it("should throw error for unhandled action type", () => {
    const action = { type: "unhandled" };
    expect(() =>
      // @ts-expect-error
      singlePieceVersionFormReducerCore(initialState, action),
    ).toThrow("Unhandled action type: unhandled");
  });
});
