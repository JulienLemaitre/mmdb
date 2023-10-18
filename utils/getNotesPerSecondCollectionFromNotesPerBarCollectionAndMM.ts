import { MetronomeMark, Section } from "@prisma/client";
import { NotesPerSecondCollection } from "./notesCalculation";
import getNotesPerSecondFromNotesPerBar from "./getNotesPerSecondFromNotesPerBar";

/**
 * Calculates the number of notes per second that must be executed, from each of the given section's fastest notes per bar values, metre and metronome mark.
 */
export default function getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM({
  section,
  metronomeMark,
}: {
  section: Pick<
    Section,
    | "fastestStructuralNotesPerBar"
    | "fastestRepeatedNotesPerBar"
    | "fastestOrnamentalNotesPerBar"
    | "fastestStaccatoNotesPerBar"
    | "metreNumerator"
    | "metreDenominator"
  >;
  metronomeMark: Pick<MetronomeMark, "beatUnit" | "bpm">;
}): NotesPerSecondCollection {
  const {
    fastestStructuralNotesPerBar,
    fastestRepeatedNotesPerBar,
    fastestStaccatoNotesPerBar,
    fastestOrnamentalNotesPerBar,
  } = section;
  const { beatUnit, bpm } = metronomeMark;

  if (
    !fastestStructuralNotesPerBar &&
    !fastestRepeatedNotesPerBar &&
    !fastestStaccatoNotesPerBar &&
    !fastestOrnamentalNotesPerBar
  ) {
    throw new Error(
      `[gNPSCFNPBCAMM] No fastest note per bar property found in given section ${JSON.stringify(
        section,
      )}}`,
    );
  }
  const notesPerBarValues = {
    fastestStructuralNotesPerBar,
    fastestRepeatedNotesPerBar,
    fastestStaccatoNotesPerBar,
    fastestOrnamentalNotesPerBar,
  };
  const notesPerSecond: NotesPerSecondCollection = Object.keys(
    notesPerBarValues,
  ).reduce((npsObject: NotesPerSecondCollection, notesPerBarType: string) => {
    if (notesPerBarValues[notesPerBarType]) {
      npsObject[notesPerBarType.replace("PerBar", "PerSecond")] =
        getNotesPerSecondFromNotesPerBar({
          notesPerBar: notesPerBarValues[notesPerBarType],
          metreNumerator: section.metreNumerator,
          metreDenominator: section.metreDenominator,
          beatUnit,
          bpm,
        });
    } else {
      // logTestError(bpm, `[gNPSFNPBAMM] No ${notesPerBarType} found in notes ${JSON.stringify(notesPerBarValues)}`)
    }
    return npsObject;
  }, {} as NotesPerSecondCollection);

  return notesPerSecond;
}
