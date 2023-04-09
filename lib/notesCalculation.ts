import {BEAT_UNIT, MetronomeMark, Section} from "@prisma/client";

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
export const noteDurationValueKeys = Object.keys(noteDurationValue) as BEAT_UNIT[];

type Notes = {
  fastestStructuralNote?: BEAT_UNIT;
  fastestStacattoNote?: BEAT_UNIT;
  fastestOrnamentalNote?: BEAT_UNIT;
}
type NotesPerSecond = {
  fastestStructuralNote?: number;
  fastestStacattoNote?: number;
  fastestOrnamentalNote?: number;
}

/**
 * Calculates the number of notes per second that must be executed, from the given section and metronome mark infos.
 * @param metronomeMark
 * @param section
 */
export function getNotesPerSecondsFromNotes({ metronomeMark, section }:
                                                             { metronomeMark: MetronomeMark, section: Section }): NotesPerSecond {
  const { beatUnit, bpm } = metronomeMark;
  const { fastestStructuralNote, fastestStacattoNote, fastestOrnamentalNote } = section;

  if (!fastestStructuralNote && !fastestStacattoNote && !fastestOrnamentalNote) {
    throw new Error("No fastest note property found in given section");
  }

  const notes = {fastestStructuralNote, fastestStacattoNote, fastestOrnamentalNote}
  // @ts-ignore
  const notesPerSecond: NotesPerSecond = Object.keys(notes).reduce((npsObject: NotesPerSecond, note: keyof typeof notes) => {
    if (notes[note]) {
      npsObject[note] = getNotesPerSecond({ note: notes[note], beatUnit, bpm })
    }
    return npsObject;
  }, {} as NotesPerSecond)

  return notesPerSecond
}

function getNotesPerSecond({ note, beatUnit, bpm }: { note: BEAT_UNIT | null, beatUnit: BEAT_UNIT, bpm: number }): number {

  if (!note) {
    throw new Error("[getNotesPerSecond] No note given");
  }
  const noteValue = noteDurationValue[note]; // ex: 1/16

//     1 Get the rhythmic value of a single beat and the given structural note
  const beatUnitValue = noteDurationValue[beatUnit]; // ex: 1/4

//     2 Calculate the duration of a single beat by dividing 60 (the number of seconds in a minute) by the BPM.
  const beatDuration = 60 / bpm; // ex: 0.5

//     3 Determine the amount of structural notes that can fit within a single beat
  const numberOfNotesPerBeat = beatUnitValue / noteValue ; // ex: 1/4 / 1/16 = 4

//     4 Divide the duration of a single beat by the number of structural notes in a single beat to get the duration of a structural note in seconds.
  const noteDuration = beatDuration / numberOfNotesPerBeat; // ex: 0.5 / 4 = 0.125

//     5 Take the reciprocal of the structural note duration in seconds to get the number of structural notes per second that must be executed.
  const notesPerSecond = 1 / noteDuration; // ex: 1 / 0.125 = 8

  return notesPerSecond;
}

export function getNotesFromNotesPerSecond({ metronomeMark, section }:
                                                      { metronomeMark: Partial<MetronomeMark>, section: Partial<Section> }): Notes {
  const { beatUnit, bpm, notesPerSecond } = metronomeMark;
  const { metreDenominator } = section;
  // console.log("getNotesFromNotesPerSecond", { beatUnit, bpm, notesPerSecond, metreDenominator })

  if (!notesPerSecond) {
    throw new Error("No notesPerSecond property found in given section");
  }

  // @ts-ignore
  const { fastestStructuralNote, fastestStacattoNote, fastestOrnamentalNote } = notesPerSecond as NotesPerSecond;

  if (!fastestStructuralNote && !fastestStacattoNote && !fastestOrnamentalNote) {
    throw new Error(`No fastest notes per second property found in given section notesPerSecond ${JSON.stringify(section)}`);
  }

  const notes: Notes = {}
  // @ts-ignore
  Object.keys(notesPerSecond).filter((note: keyof typeof notesPerSecond) => notesPerSecond[note]).forEach((note: keyof typeof notesPerSecond) => {
    if (notesPerSecond[note]) {
      const notesPerSecondRawValue = notesPerSecond[note]
      // Get the value of notesPerSecondRawValue. If it contains "(", keep only what come before it. Convert it to number
      // ex: 1/16 (staccato) => 1/16
      // @ts-ignore
      const notesPerSecondValue = Number(notesPerSecondRawValue.toString().split(" ")[0])

      try {
      // @ts-ignore
      notes[note] = getNote({ notesPerSecond: notesPerSecondValue, beatUnit, bpm, metreDenominator })
      } catch (e) {
        // @ts-ignore
        notes[note] = null
      }
    }
  })

  return notes

 }

 function getNote({ notesPerSecond, beatUnit, bpm }: { notesPerSecond: number, beatUnit: BEAT_UNIT, bpm: number }): BEAT_UNIT {
   if (!notesPerSecond) {
     throw new Error("[getNote]  notesPerSecond given");
   }
   const beatUnitValue = noteDurationValue[beatUnit]; // ex: 1/4
   const beatDuration = 60 / bpm; // ex: 0.5
   const noteDuration = 1 / notesPerSecond; // ex: 0.125
   const numberOfNotesPerBeat = beatDuration / noteDuration; // ex: 0.5 / 0.125 = 4
   const noteValue = beatUnitValue / numberOfNotesPerBeat; // ex: 1/4 / 4 = 1/16
  // console.log("getNote :", { beatUnitValue, beatDuration, noteDuration, numberOfNotesInSingleBeat, noteValue })
   // @ts-ignore
   const noteAttempt1 = noteDurationValueKeys.find((note) => noteDurationValue[note] === noteValue || Math.abs(noteDurationValue[note] - noteValue) < 0.0002);
   const noteAttempt2 = noteDurationValueKeys.find((note) => Math.abs(noteDurationValue[note] - noteValue) < 0.0005);
   const noteAttempt3 = noteDurationValueKeys.find((note) => Math.abs(noteDurationValue[note] - noteValue) < 0.0008);
   const noteAttempt4 = noteDurationValueKeys.find((note) => Math.abs(noteDurationValue[note] - noteValue) < 0.001);
   const note = noteAttempt1 || noteAttempt2 || noteAttempt3 || noteAttempt4;
   if (note) {
     const noteIndex = [noteAttempt1, noteAttempt2, noteAttempt3, noteAttempt4].findIndex((n) => n === note) + 1
      console.log(`[getNote] noteValue ${noteValue} is same or close (${noteIndex} aprox.) to ${note}:`, noteDurationValue[note]);
     return note;
   }
     console.log(`[getNote] No note determined for notesPerSecond ${notesPerSecond} -> noteValue ${noteValue}`)
      throw new Error(`No note determined for noteValue ${noteValue}`);
 }