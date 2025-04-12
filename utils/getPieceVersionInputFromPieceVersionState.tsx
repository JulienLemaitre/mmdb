import {
  PieceVersionInput,
  PieceVersionState,
  MovementInput,
  SectionInput,
  SectionState,
  MovementState,
} from "@/types/formTypes";
import getKeyLabel from "@/utils/getKeyLabel";
import formatToPhraseCase from "@/utils/formatToPhraseCase";

function getSectionInputFromSectionState(sectionState: SectionState) {
  const sectionInput: SectionInput = {
    metreNumerator: sectionState.metreNumerator,
    metreDenominator: sectionState.metreDenominator,
    fastestStructuralNotesPerBar: sectionState.fastestStructuralNotesPerBar,
    fastestStaccatoNotesPerBar: sectionState.fastestStaccatoNotesPerBar,
    fastestRepeatedNotesPerBar: sectionState.fastestRepeatedNotesPerBar,
    fastestOrnamentalNotesPerBar: sectionState.fastestOrnamentalNotesPerBar,
    tempoIndication: {
      value: sectionState.tempoIndication.id,
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
    category: {
      value: pieceVersionState.category,
      label: formatToPhraseCase(pieceVersionState.category),
    },
    movements: pieceVersionState.movements.map(
      getMovementInputFromMovementState,
    ),
  };
}
