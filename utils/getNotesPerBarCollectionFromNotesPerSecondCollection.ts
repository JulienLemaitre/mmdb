import {
  NotesPerBarCollection,
  NotesPerSecondCollection,
} from "./notesCalculation";
import parseValueRemoveParenthesis from "./parseValueRemoveParenthesis";
import getNotesPerBarFromNotesPerSecond from "./getNotesPerBarFromNotesPerSecond";

export default function getNotesPerBarCollectionFromNotesPerSecondCollection({
  metronomeMark,
}: {
  metronomeMark: {
    beatUnit: any;
    bpm: any;
    metreDenominator: number;
    metreNumerator: number;
    notesPerSecond: NotesPerSecondCollection;
  };
}) {
  const { beatUnit, bpm, notesPerSecond, metreNumerator, metreDenominator } =
    metronomeMark;

  if (!notesPerSecond) {
    throw new Error("[gNV] No notesPerSecond property found in given section");
  }

  // @ts-ignore
  const {
    fastestStructuralNotesPerSecond,
    fastestStaccatoNotesPerSecond,
    fastestOrnamentalNotesPerSecond,
  } = notesPerSecond as NotesPerSecondCollection;

  if (
    !fastestStructuralNotesPerSecond &&
    !fastestStaccatoNotesPerSecond &&
    !fastestOrnamentalNotesPerSecond
  ) {
    throw new Error(
      `[gNV] No fastest notes per second property found in given metronomeMark notesPerSecond ${JSON.stringify(
        metronomeMark,
      )}`,
    );
  }

  const notes: NotesPerBarCollection = {};
  Object.keys(notesPerSecond)
    .filter(
      // @ts-ignore
      (note: keyof typeof notesPerSecond) =>
        notesPerSecond[note] && !isNaN(Number(notesPerSecond[note])),
    )
    // @ts-ignore
    .forEach((note: keyof typeof notesPerSecond) => {
      const notesPerSecondRawValue = notesPerSecond[note];
      // Get the value of notesPerSecondRawValue. If it contains "(", keep only what come before it. Convert it to number
      // ex: 1/16 (staccato) => 1/16
      const notesPerSecondValue = Number(
        parseValueRemoveParenthesis(notesPerSecondRawValue?.toString()),
      );
      // console.log(`[${JSON.stringify({ beatUnit, bpm, notesPerSecond })}] notesPerSecondValue :`, notesPerSecondValue)

      try {
        notes[note.replace("PerSecond", "PerBar")] =
          getNotesPerBarFromNotesPerSecond({
            notesPerSecond: notesPerSecondValue,
            beatUnit,
            bpm,
            metreNumerator,
            metreDenominator,
          });
      } catch (e) {
        console.log(
          `[[gNPBCFNPSC] Error] notesPerSecond[fastestNote] :`,
          notesPerSecond[note],
        );
        console.log(
          `[[gNPBCFNPSC] Error] notes[fastestNote.replace('PerSecond', 'PerBar')] :`,
          notes[note.replace("PerSecond", "PerBar")],
        );
        throw new Error(
          `[gNPBCFNPSC] Error while processing ${note} in mm: ${JSON.stringify(
            metronomeMark,
          )}`,
        );
        // @ts-ignore
        notes[note.replace("PerSecond", "PerBar")] = null;
      }
    });

  // const fastestNoteError = ["fastestStructuralNotesPerSecond", "fastestStaccatoNotesPerSecond", "fastestOrnamentalNotesPerSecond"].find((fastestNote) => !!notesPerSecond[fastestNote] && !!notes[fastestNote.replace('PerSecond', 'PerBar')])
  // if (fastestNoteError) {
  //   console.log(`[[gNPBCFNPSC] Error] notesPerSecond[fastestNote] :`, notesPerSecond[fastestNoteError])
  //   console.log(`[[gNPBCFNPSC] Error] notes[fastestNote.replace('PerSecond', 'PerBar')] :`, notes[fastestNoteError.replace('PerSecond', 'PerBar')])
  //  throw new Error(`[gNPBCFNPSC] Error while processing ${fastestNoteError} in mm: ${JSON.stringify(metronomeMark)}`)
  // }

  return notes;
}
