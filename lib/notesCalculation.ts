import {NOTE_VALUE, MetronomeMark, Section} from "@prisma/client";
import getNotesPerSecondFromNotesPerBar from "@/lib/getNotesPerSecondFromNotesPerBar";

export const noteDurationValue = {
  WHOLE: 1,
  HALF: 1/2,
  DOTTED_HALF: 3/4,
  QUARTER: 1/4,
  DOTTED_QUARTER: 3/8,
  EIGHTH: 1/8,
  DOTTED_EIGHTH: 3/16,
  SIXTEENTH: 1/16,
  DOTTED_SIXTEENTH: 3/32,
  THIRTYSECOND: 1/32,
  DOTTED_THIRTYSECOND: 3/64,
  SIXTYFOURTH: 1/64,
  DOTTED_SIXTYFOURTH: 3/128,
  HUNDREDTWENTYEIGHTH: 1/128,
  DOTTED_HUNDREDTWENTYEIGHTH: 3/256,
  TRIPLET_EIGHTH: 1/12,
  TRIPLET_SIXTEENTH: 1/24,
  // TRIPLET_THIRTYSECOND: 1/48,
  // TRIPLET_SIXTYFOURTH: 1/96,
  QUADRUPLET_EIGHTH: 3/32,
  QUINTUPLET_SIXTEENTH: 1/20,
  QUINTUPLET_THIRTYSECOND: 1/40, // 5 thirtysecond = 1 eighth [Beethoven 4 - 1st movement]
  SEXTUPLET_SIXTEENTH: 1/24,
  SEXTUPLET_THIRTYSECOND: 1/48, // 6 sextuplet = 1 eighth [Beethoven 3 - 2nd movement]
  SEPTUPLET_SIXTEENTH: 1/28,
  SEPTUPLET_HUNDREDTWENTYEIGHTH: 1/112,
//   OCTUPLET_SIXTEENTH: 1/32,
}
export const noteDurationValueKeys = Object.keys(noteDurationValue) as NOTE_VALUE[];

export type NoteValues = {
  fastestStructuralNoteValue?: NOTE_VALUE;
  fastestStaccatoNoteValue?: NOTE_VALUE;
  fastestOrnamentalNoteValue?: NOTE_VALUE;
}
export type NotesPerBarCollection = {
  fastestStructuralNotesPerBar?: number;
  fastestStaccatoNotesPerBar?: number;
  fastestOrnamentalNotesPerBar?: number;
  fastestRepeatedNotesPerBar?: number;
}
export type NotesPerSecondCollection = {
  fastestStructuralNotesPerSecond?: number;
  fastestStaccatoNotesPerSecond?: number;
  fastestOrnamentalNotesPerSecond?: number;
  fastestRepeatedNotesPerSecond?: number;
}

function logTestError(bpm, ...props) {
  if (bpm === 108) {
    console.log(props)
  }
}

/**
 * Calculates the number of notes per second that must be executed, from the given section and metronome mark infos.
 * @param metronomeMark
 * @param section
 */
export function getNotesPerSecondsFromNoteValues({ metronomeMark }:
                                                             { metronomeMark: Pick<MetronomeMark, "beatUnit" | "bpm" | "noteValues"> }): NotesPerSecondCollection {
  const { beatUnit, bpm, noteValues: mmNotevalues } = metronomeMark;
  const { fastestStructuralNoteValue, fastestStaccatoNoteValue, fastestOrnamentalNoteValue } = mmNotevalues as any;

  if (!fastestStructuralNoteValue && !fastestStaccatoNoteValue && !fastestOrnamentalNoteValue) {
    throw new Error(`[gNPSFNV] No fastest note property found in given mm.noteValues ${JSON.stringify(mmNotevalues)}}`);
  }

  const noteValues = { fastestStructuralNoteValue, fastestStaccatoNoteValue, fastestOrnamentalNoteValue }
  // logTestError(bpm, '[gNPSFNV] ', noteValues)
  // @ts-ignore
  const notesPerSecond: NotesPerSecondCollection = Object.keys(noteValues).reduce((npsObject: NotesPerSecondCollection, noteValueType: keyof typeof noteValues) => {
    if (noteValues[noteValueType]) {
      npsObject[noteValueType.replace('Value', 'PerSecond')] = getNotesPerSecond({ noteValueType: noteValues[noteValueType], beatUnit, bpm })
    } else {
      // logTestError(bpm, `[gNPSFNV] No ${noteValueType} found in notes ${JSON.stringify(noteValues)}`)
    }
    return npsObject;
  }, {} as NotesPerSecondCollection)

  return notesPerSecond
}

/**
 * Calculates the number of notes per second that must be executed, from each of the given section's fastest notes per second values.
 */
export function getNotesPerSecondsFromNotesPerBarAndMM({ section, metronomeMark }: { section: Pick<Section, "fastestStructuralNotesPerBar" | "fastestRepeatedNotesPerBar" | "fastestOrnamentalNotesPerBar" | "fastestStaccatoNotesPerBar" | "metreNumerator" | "metreDenominator">, metronomeMark: Pick<MetronomeMark, "beatUnit" | "bpm"> }): NotesPerSecondCollection {
  const { fastestStructuralNotesPerBar, fastestRepeatedNotesPerBar, fastestStaccatoNotesPerBar, fastestOrnamentalNotesPerBar } = section
  const { beatUnit, bpm } = metronomeMark

  if (!fastestStructuralNotesPerBar && !fastestRepeatedNotesPerBar && !fastestStaccatoNotesPerBar && !fastestOrnamentalNotesPerBar) {
    throw new Error(`[gNPSFNPBAMM] No fastest note per bar property found in given section ${JSON.stringify(section)}}`);
  }
  const notesPerBarValues = { fastestStructuralNotesPerBar, fastestRepeatedNotesPerBar, fastestStaccatoNotesPerBar, fastestOrnamentalNotesPerBar }
  const notesPerSecond: NotesPerSecondCollection = Object.keys(notesPerBarValues).reduce((npsObject: NotesPerSecondCollection, notesPerBarType: string) => {
    if (notesPerBarValues[notesPerBarType]) {
      npsObject[notesPerBarType.replace('PerBar', 'PerSecond')] = getNotesPerSecondFromNotesPerBar({ notesPerBar: notesPerBarValues[notesPerBarType], metreNumerator: section.metreNumerator, metreDenominator: section.metreDenominator, beatUnit, bpm })
    } else {
      // logTestError(bpm, `[gNPSFNPBAMM] No ${notesPerBarType} found in notes ${JSON.stringify(notesPerBarValues)}`)
    }
    return npsObject;
  }, {} as NotesPerSecondCollection)

  return notesPerSecond
}

function getNotesPerSecond({ noteValueType, beatUnit, bpm }: { noteValueType?: NOTE_VALUE | null, beatUnit: NOTE_VALUE, bpm: number }): number {

  // logTestError(bpm, { noteValueType, beatUnit, bpm })

  if (!noteValueType) {
    throw new Error("[gNPS] No note given");
  }
  const noteValueAsNumber = noteDurationValue[noteValueType]; // ex: 1/16
  // logTestError(bpm, `[gNPS] noteValue :`, noteValueAsNumber)

//     1 Get the rhythmic value of a single beat and the given structural note
  const beatUnitValue = noteDurationValue[beatUnit]; // ex: 1/4

//     2 Calculate the duration of a single beat by dividing 60 (the number of seconds in a minute) by the BPM.
  const beatDuration = 60 / bpm; // ex: 0.5

//     3 Determine the amount of structural notes that can fit within a single beat
  const numberOfNotesPerBeat = beatUnitValue / noteValueAsNumber ; // ex: 1/4 / 1/16 = 4

//     4 Divide the duration of a single beat by the number of structural notes in a single beat to get the duration of a structural note in seconds.
  const noteDuration = beatDuration / numberOfNotesPerBeat; // ex: 0.5 / 4 = 0.125

//     5 Take the reciprocal of the structural note duration in seconds to get the number of structural notes per second that must be executed.
  const notesPerSecond = 1 / noteDuration; // ex: 1 / 0.125 = 8
  // logTestError(bpm, `[gNPS] notesPerSecond :`, notesPerSecond)

  return notesPerSecond;
}



 export function getNotesPerBar({ noteValue, metreNumerator, metreDenominator }: { noteValue: NOTE_VALUE, metreNumerator: number, metreDenominator: number }): number {
  console.log(`[getNotesPerBar] INPUT:`, { noteValue, metreNumerator, metreDenominator })
  if (!noteValue) {
  throw new Error("[getNotesPerBar] No noteValue given");
  }
   const noteValueAsNumber = noteDurationValue[noteValue]; // ex: 1/16
   const barDuration = metreNumerator / metreDenominator; // ex: 3/4 = 0.75
   const numberOfNotesPerBar = barDuration / noteValueAsNumber; // ex: 0.75 / 1/16 = 12
   console.log(`[getNotesPerBar] numberOfNotesPerBar :`, numberOfNotesPerBar)
   return numberOfNotesPerBar;
 }