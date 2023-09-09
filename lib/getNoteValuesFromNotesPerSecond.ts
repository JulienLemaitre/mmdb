import {MetronomeMark, NOTE_VALUE} from "@prisma/client";
import {noteDurationValue, noteDurationValueKeys, NoteValues} from "@/lib/notesCalculation";

export default function getNoteValuesFromNotesPerSecond({ metronomeMark, getNoteMock }:
                                                  { metronomeMark: Pick<MetronomeMark, "beatUnit" | "bpm" | "notesPerSecond">, getNoteMock?: () => any }): NoteValues {
  const { beatUnit, bpm, notesPerSecond } = metronomeMark;

  if (!notesPerSecond) {
    throw new Error("[gNV] No notesPerSecond property found in given section");
  }

  // @ts-ignore
  const { fastestStructuralNotesPerSecond, fastestStaccatoNotesPerSecond, fastestOrnamentalNotesPerSecond } = notesPerSecond as NotesPerSecond;

  if (!fastestStructuralNotesPerSecond && !fastestStaccatoNotesPerSecond && !fastestOrnamentalNotesPerSecond) {
    throw new Error(`[gNV] No fastest notes per second property found in given metronomeMark notesPerSecond ${JSON.stringify(metronomeMark)}`);
  }

  const notes: NoteValues = {}
  // @ts-ignore
  Object.keys(notesPerSecond).filter((note: keyof typeof notesPerSecond) => notesPerSecond[note]).forEach((note: keyof typeof notesPerSecond) => {
      const notesPerSecondRawValue = notesPerSecond[note]
      // Get the value of notesPerSecondRawValue. If it contains "(", keep only what come before it. Convert it to number
      // ex: 1/16 (staccato) => 1/16
      // @ts-ignore
      const notesPerSecondValue = Number(notesPerSecondRawValue.toString().split(" ")[0])
      // console.log(`[${JSON.stringify({ beatUnit, bpm, notesPerSecond })}] notesPerSecondValue :`, notesPerSecondValue)

      try {
        // For testPurpose, we can mock the getNoteValues function
        const getNoteFunc = getNoteMock || getNoteValues
        // @ts-ignore
        notes[note.replace('PerSecond', 'Value')] = getNoteFunc({ notesPerSecond: notesPerSecondValue, beatUnit, bpm })
      } catch (e) {
        // @ts-ignore
        notes[note.replace('PerSecond', 'Value')] = null
      }
    }
  )

  return notes

}

function getNoteValues({ notesPerSecond, beatUnit, bpm }: { notesPerSecond: number, beatUnit: NOTE_VALUE, bpm: number }): NOTE_VALUE {
  if (!notesPerSecond) {
    throw new Error("[getNoteValues] No notesPerSecond given");
  }
  const beatUnitValue = noteDurationValue[beatUnit]; // ex: 1/4
  const beatDuration = 60 / bpm; // ex: 0.5
  const noteDuration = 1 / notesPerSecond; // ex: 0.125
  const numberOfNotesPerBeat = beatDuration / noteDuration; // ex: 0.5 / 0.125 = 4
  const noteValue = beatUnitValue / numberOfNotesPerBeat; // ex: 1/4 / 4 = 1/16
  // console.log("getNoteValues :", { beatUnitValue, beatDuration, noteDuration, numberOfNotesInSingleBeat, noteValue })
  // @ts-ignore
  const noteAttempt1 = noteDurationValueKeys.find((note) => noteDurationValue[note] === noteValue || Math.abs(noteDurationValue[note] - noteValue) < 0.0002);
  const noteAttempt2 = noteDurationValueKeys.find((note) => Math.abs(noteDurationValue[note] - noteValue) < 0.0005);
  const noteAttempt3 = noteDurationValueKeys.find((note) => Math.abs(noteDurationValue[note] - noteValue) < 0.0008);
  const noteAttempt4 = noteDurationValueKeys.find((note) => Math.abs(noteDurationValue[note] - noteValue) < 0.001);
  const note = noteAttempt1 || noteAttempt2 || noteAttempt3 || noteAttempt4;
  if (note) {
    const noteIndex = [noteAttempt1, noteAttempt2, noteAttempt3, noteAttempt4].findIndex((n) => n === note) + 1
    // console.log(`[getNoteValues] noteValue ${noteValue} is same or close (${noteIndex} aprox.) to ${note}:`, noteDurationValue[note]);
    return note;
  }
  // console.log(`[getNoteValues] No note determined for notesPerSecond ${notesPerSecond} -> noteValue ${noteValue}`)
  throw new Error(`No note determined for noteValue ${noteValue}`);
}