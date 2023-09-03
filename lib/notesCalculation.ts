import {NOTE_VALUE, MetronomeMark, Section} from "@prisma/client";

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

type NoteValues = {
  fastestStructuralNoteValue?: NOTE_VALUE;
  fastestStaccatoNoteValue?: NOTE_VALUE;
  fastestOrnamentalNoteValue?: NOTE_VALUE;
}
type NotesPerSecond = {
  fastestStructuralNotePerSecond?: number;
  fastestStaccatoNotePerSecond?: number;
  fastestOrnamentalNotePerSecond?: number;
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
                                                             { metronomeMark: Pick<MetronomeMark, "beatUnit" | "bpm" | "noteValues"> }): NotesPerSecond {
  const { beatUnit, bpm, noteValues: mmNotevalues } = metronomeMark;
  const { fastestStructuralNoteValue, fastestStaccatoNoteValue, fastestOrnamentalNoteValue } = mmNotevalues as any;

  if (!fastestStructuralNoteValue && !fastestStaccatoNoteValue && !fastestOrnamentalNoteValue) {
    throw new Error(`[gNPSFNV] No fastest note property found in given mm.noteValues ${JSON.stringify(mmNotevalues)}}`);
  }

  const noteValues = { fastestStructuralNoteValue, fastestStaccatoNoteValue, fastestOrnamentalNoteValue }
  // logTestError(bpm, '[gNPSFNV] ', noteValues)
  // @ts-ignore
  const notesPerSecond: NotesPerSecond = Object.keys(noteValues).reduce((npsObject: NotesPerSecond, noteValueType: keyof typeof noteValues) => {
    if (noteValues[noteValueType]) {
      npsObject[noteValueType.replace('Value', 'PerSecond')] = getNotesPerSecond({ noteValueType: noteValues[noteValueType], beatUnit, bpm })
    } else {
      // logTestError(bpm, `[gNPSFNV] No ${noteValueType} found in notes ${JSON.stringify(noteValues)}`)
    }
    return npsObject;
  }, {} as NotesPerSecond)

  return notesPerSecond
}

/**
 * Calculates the number of notes per second that must be executed, from each of the given section's fastest notes per second values.
 */
export function getNotesPerSecondsFromNotesPerBarAndMM({ section, metronomeMark }: { section: Pick<Section, "fastestStructuralNotePerBar" | "fastestRepeatedNotePerBar" | "fastestOrnamentalNotePerBar" | "fastestStaccatoNotePerBar" | "metreNumerator" | "metreDenominator">, metronomeMark: Pick<MetronomeMark, "beatUnit" | "bpm"> }): NotesPerSecond {
  const { fastestStructuralNotePerBar, fastestRepeatedNotePerBar, fastestStaccatoNotePerBar, fastestOrnamentalNotePerBar } = section
  const { beatUnit, bpm } = metronomeMark

  if (!fastestStructuralNotePerBar && !fastestRepeatedNotePerBar && !fastestStaccatoNotePerBar && !fastestOrnamentalNotePerBar) {
    throw new Error(`[gNPSFNPBAMM] No fastest note per bar property found in given section ${JSON.stringify(section)}}`);
  }
  const notePerBarValues = { fastestStructuralNotePerBar, fastestRepeatedNotePerBar, fastestStaccatoNotePerBar, fastestOrnamentalNotePerBar }
  const notesPerSecond: NotesPerSecond = Object.keys(notePerBarValues).reduce((npsObject: NotesPerSecond, notePerBarType: string) => {
    if (notePerBarValues[notePerBarType]) {
      npsObject[notePerBarType.replace('PerBar', 'PerSecond')] = getNotesPerSecondFromNotePerBar({ notesPerBar: notePerBarValues[notePerBarType], meterNumerator: section.metreNumerator, meterDenominator: section.metreDenominator, beatUnit, bpm })
    } else {
      // logTestError(bpm, `[gNPSFNPBAMM] No ${notePerBarType} found in notes ${JSON.stringify(notePerBarValues)}`)
    }
    return npsObject;
  }, {} as NotesPerSecond)

  return notesPerSecond
}

/**
 * Calculates the number of notes per second that must be executed, from the given number of notes per bar, beat unit and bpm.
 * @param notesPerBar
 * @param meterNumerator
 * @param meterDenominator
 * @param beatUnit
 * @param bpm
 */
export function getNotesPerSecondFromNotePerBar({ notesPerBar, meterNumerator, meterDenominator, bpm, beatUnit }: { notesPerBar: number, meterNumerator: number, meterDenominator: number, bpm: number, beatUnit: NOTE_VALUE }): number {
  if (!notesPerBar || !meterNumerator || !meterDenominator || !bpm || !beatUnit) {
    throw new Error("[gNPSFNPB] Invalid or missing parameter");
  }
  // const isTest = notesPerBar === 4 && meterNumerator === 4 && meterDenominator === 4 && bpm === 120 && beatUnit === NOTE_VALUE.QUARTER; // 1/24
  const isTest = false
  // Calculate the duration of one beat in seconds
  const beatDuration = 60 / bpm;
  if (isTest) console.log(`[TEST gNPSFNPB] beatDuration :`, beatDuration)

  // Get the rhythmic value of a single beat and the given structural note
  const beatUnitValue = noteDurationValue[beatUnit]; // ex: 1/4
  if (isTest) console.log(`[TEST gNPSFNPB] beatUnitValue :`, beatUnitValue)

  // Calculate the duration of one bar in seconds
  const secondsPerBar = beatDuration * (meterNumerator / meterDenominator) / beatUnitValue;
  if (isTest) console.log(`[TEST gNPSFNPB] secondsPerBar :`, secondsPerBar)

  // Calculate the notes per second
  const notesPerSecond = notesPerBar / secondsPerBar;
  if (isTest) console.log(`[TEST gNPSFNPB] notesPerSecond :`, notesPerSecond)

  console.log(`[gNPSFNPB RESULT] notesPerSecond: ${notesPerSecond} |`, JSON.stringify({ notesPerBar, meterNumerator, meterDenominator, bpm, beatUnit }))
  return notesPerSecond;
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

export function getNoteValuesFromNotesPerSecond({ metronomeMark, getNoteMock }:
                                                      { metronomeMark: Pick<MetronomeMark, "beatUnit" | "bpm" | "notesPerSecond">, getNoteMock?: () => any }): NoteValues {
  const { beatUnit, bpm, notesPerSecond } = metronomeMark;

  if (!notesPerSecond) {
    throw new Error("[gNV] No notesPerSecond property found in given section");
  }

  // @ts-ignore
  const { fastestStructuralNotePerSecond, fastestStaccatoNotePerSecond, fastestOrnamentalNotePerSecond } = notesPerSecond as NotesPerSecond;

  if (!fastestStructuralNotePerSecond && !fastestStaccatoNotePerSecond && !fastestOrnamentalNotePerSecond) {
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

 export function getNotePerBar({ noteValue, metreNumerator, metreDenominator }: { noteValue: NOTE_VALUE, metreNumerator: number, metreDenominator: number }): number {
  console.log(`[getNotePerBar] INPUT:`, { noteValue, metreNumerator, metreDenominator })
  if (!noteValue) {
  throw new Error("[getNotePerBar] No noteValue given");
  }
   const noteValueAsNumber = noteDurationValue[noteValue]; // ex: 1/16
   const barDuration = metreNumerator / metreDenominator; // ex: 3/4 = 0.75
   const numberOfNotesPerBar = barDuration / noteValueAsNumber; // ex: 0.75 / 1/16 = 12
   console.log(`[getNotePerBar] numberOfNotesPerBar :`, numberOfNotesPerBar)
   return numberOfNotesPerBar;
 }