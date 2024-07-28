import {
  PieceVersionInput,
  PieceVersionState,
  MovementInput,
  SectionInput,
  SectionState,
  MovementState,
} from "@/types/formTypes";
import getKeyLabel from "@/utils/getKeyLabel";

function getSectionInputFromSectionState(sectionState: SectionState) {
  const sectionInput: SectionInput = {
    metreNumerator: sectionState.metreNumerator,
    metreDenominator: sectionState.metreDenominator,
    fastestStructuralNotesPerBar: sectionState.fastestStructuralNotesPerBar,
    fastestStaccatoNotesPerBar: sectionState.fastestStaccatoNotesPerBar,
    fastestRepeatedNotesPerBar: sectionState.fastestRepeatedNotesPerBar,
    fastestOrnamentalNotesPerBar: sectionState.fastestOrnamentalNotesPerBar,
    tempoIndication: {
      value: sectionState.tempoIndication.text,
      label: sectionState.tempoIndication.text,
    },
    isCommonTime: sectionState.isCommonTime,
    isCutTime: sectionState.isCutTime,
    isFastestStructuralNoteBelCanto:
      sectionState.isFastestStructuralNoteBelCanto,
    comment: sectionState.comment,
  };
  return sectionInput;
}

function getMovementInputFromMovementState(movementState: MovementState) {
  const movementInput: MovementInput = {
    key: { value: movementState.key, label: getKeyLabel(movementState.key) },
    sections: movementState.sections.map(getSectionInputFromSectionState),
  };
  return movementInput;
}

export default function getPieceVersionInputFromPieceVersionState(
  pieceVersionState: PieceVersionState,
): PieceVersionInput {
  return {
    id: pieceVersionState.id,
    pieceId: pieceVersionState.pieceId,
    category: {
      value: pieceVersionState.category,
      label: pieceVersionState.category,
    },
    movements: pieceVersionState.movements.map(
      getMovementInputFromMovementState,
    ),
  };
}
