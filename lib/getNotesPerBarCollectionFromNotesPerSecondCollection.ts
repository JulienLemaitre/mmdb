import {NotesPerBarCollection, NotesPerSecondCollection} from "@/lib/notesCalculation";
import parseValueRemoveParenthesis from "@/lib/parseValueRemoveParenthesis";
import getNotesPerBarFromNotesPerSecond from "@/lib/getNotesPerBarFromNotesPerSecond";

export default function getNotesPerBarCollectionFromNotesPerSecondCollection({ metronomeMark }: { metronomeMark: { beatUnit: any; bpm: any; metreDenominator: number; metreNumerator: number; notesPerSecond: NotesPerSecondCollection }}) {
  const { beatUnit, bpm, notesPerSecond, metreNumerator, metreDenominator } = metronomeMark;

  if (!notesPerSecond) {
    throw new Error("[gNV] No notesPerSecond property found in given section");
  }

  // @ts-ignore
  const { fastestStructuralNotesPerSecond, fastestStaccatoNotesPerSecond, fastestOrnamentalNotesPerSecond } = notesPerSecond as NotesPerSecond;

  if (!fastestStructuralNotesPerSecond && !fastestStaccatoNotesPerSecond && !fastestOrnamentalNotesPerSecond) {
    throw new Error(`[gNV] No fastest notes per second property found in given metronomeMark notesPerSecond ${JSON.stringify(metronomeMark)}`);
  }

  const notes: NotesPerBarCollection = {}
  // @ts-ignore
  Object.keys(notesPerSecond).filter((note: keyof typeof notesPerSecond) => notesPerSecond[note]).forEach((note: keyof typeof notesPerSecond) => {
      const notesPerSecondRawValue = notesPerSecond[note]
      // Get the value of notesPerSecondRawValue. If it contains "(", keep only what come before it. Convert it to number
      // ex: 1/16 (staccato) => 1/16
      // @ts-ignore
      const notesPerSecondValue = Number(parseValueRemoveParenthesis(notesPerSecondRawValue.toString()))
      // console.log(`[${JSON.stringify({ beatUnit, bpm, notesPerSecond })}] notesPerSecondValue :`, notesPerSecondValue)

      try {
        notes[note.replace('PerSecond', 'Value')] = getNotesPerBarFromNotesPerSecond({ notesPerSecond: notesPerSecondValue, beatUnit, bpm, metreNumerator, metreDenominator })
      } catch (e) {
        // @ts-ignore
        notes[note.replace('PerSecond', 'Value')] = null
      }
    }
  )

  return notes

}