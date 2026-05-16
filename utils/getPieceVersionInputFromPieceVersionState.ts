import {
  PieceVersionInput,
  PieceVersionState,
  MovementInput,
  SectionInput,
  SectionState,
  MovementState,
  TempoIndicationState,
} from "@/types/formTypes";
import getKeyLabel from "@/utils/getKeyLabel";
import formatToPhraseCase from "@/utils/formatToPhraseCase";

export default function getPieceVersionInputFromPieceVersionState(
  pieceVersionState: PieceVersionState,
  stateTempoIndications: TempoIndicationState[],
): PieceVersionInput {
  function getSectionInputFromSectionState(sectionState: SectionState) {
    const sectionInput: SectionInput = {
      id: sectionState.id,
      metreNumerator: sectionState.metreNumerator,
      metreDenominator: sectionState.metreDenominator,
      fastestStructuralNotesPerBar: sectionState.fastestStructuralNotesPerBar,
      fastestStaccatoNotesPerBar: sectionState.fastestStaccatoNotesPerBar,
      fastestRepeatedNotesPerBar: sectionState.fastestRepeatedNotesPerBar,
      fastestOrnamentalNotesPerBar: sectionState.fastestOrnamentalNotesPerBar,
      tempoIndication: {
        value: sectionState.tempoIndicationId,
        label:
          stateTempoIndications.find(
            (ti) => ti.id === sectionState.tempoIndicationId,
          )?.text || "",
      },
      isCommonTime: sectionState.isCommonTime,
      isCutTime: sectionState.isCutTime,
      isFastestStructuralNoteBelCanto:
        sectionState.isFastestStructuralNoteBelCanto,
      comment: sectionState.comment,
      commentForReview: sectionState.commentForReview,
    };
    return sectionInput;
  }

  function getMovementInputFromMovementState(movementState: MovementState) {
    const movementInput: MovementInput = {
      id: movementState.id,
      key: { value: movementState.key, label: getKeyLabel(movementState.key) },
      sections: movementState.sections.map(getSectionInputFromSectionState),
    };
    return movementInput;
  }

  return {
    id: pieceVersionState.id,
    category: {
      value: pieceVersionState.category,
      label: formatToPhraseCase(pieceVersionState.category),
    },
    movements: pieceVersionState.movements.map((mvt) =>
      getMovementInputFromMovementState(mvt),
    ),
  };
}
