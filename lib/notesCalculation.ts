import {BEAT_UNIT, MetronomeMark, Section} from "@prisma/client";

const noteDurationValue = {
  WHOLE: 1,
  HALF: 0.5,
  DOTTED_HALF: 0.75,
  QUARTER: 0.25,
  DOTTED_QUARTER: 0.375,
  EIGHTH: 0.125,
  DOTTED_EIGHTH: 0.1875,
  SIXTEENTH: 0.0625,
  DOTTED_SIXTEENTH: 0.09375,
  THIRTYSECOND: 0.03125,
  DOTTED_THIRTYSECOND: 0.046875,
  SIXTYFOURTH: 0.015625,
  DOTTED_SIXTYFOURTH: 0.0234375,
  HUNDREDTWENTYEIGHTH: 0.0078125,
  DOTTED_HUNDREDTWENTYEIGHTH: 0.01171875,
}

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
  const { metreDenominator, fastestStructuralNote, fastestStacattoNote, fastestOrnamentalNote } = section;

  if (!fastestStructuralNote && !fastestStacattoNote && !fastestOrnamentalNote) {
    throw new Error("No fastest note property found in given section");
  }

  const notes = {fastestStructuralNote, fastestStacattoNote, fastestOrnamentalNote}
  // @ts-ignore
  const notesPerSecond: NotesPerSecond = Object.keys(notes).reduce((npsObject: NotesPerSecond, note: keyof typeof notes) => {
    if (notes[note]) {
      npsObject[note] = getNotesPerSecond({ note: notes[note], beatUnit, bpm, metreDenominator })
    }
    return npsObject;
  }, {} as NotesPerSecond)

  return notesPerSecond
}

function getNotesPerSecond({ note, beatUnit, bpm, metreDenominator }: { note: BEAT_UNIT | null, beatUnit: BEAT_UNIT, bpm: number, metreDenominator: number }): number {

  if (!note) {
    throw new Error("No note given");
  }
  const noteValue = noteDurationValue[note]; // ex: 1/16

//     1 Get the rhythmic value of a single beat and the given structural note
  const beatUnitValue = noteDurationValue[beatUnit]; // ex: 1/4

//     2 Calculate the duration of a single beat by dividing 60 (the number of seconds in a minute) by the BPM.
  const beatDuration = 60 / bpm; // ex: 0.5

//     3 Determine the amount of structural notes that can fit within a single beat based on the denominator of the meter of the piece. meter = metreNumerator / metreDenominator
  const numberOfNotesInSingleBeat = beatUnitValue / noteValue ; // ex: 1/4 / 1/16 = 4

//     4 Divide the duration of a single beat by the number of structural notes in a single beat to get the duration of a structural note in seconds.
  const noteDuration = beatDuration / numberOfNotesInSingleBeat; // ex: 0.5 / 4 = 0.125

//     5 Take the reciprocal of the structural note duration in seconds to get the number of structural notes per second that must be executed.
  const notesPerSecond = 1 / noteDuration; // ex: 1 / 0.125 = 8

  return notesPerSecond;
}

export function getNotesFromNotesPerSecond({ metronomeMark, section }:
                                                      { metronomeMark: MetronomeMark, section: Section }): Notes {
  const { beatUnit, bpm, notesPerSecond } = metronomeMark;
  const { metreDenominator } = section;

  if (!notesPerSecond) {
    throw new Error("No notesPerSecond property found in given section");
  }

  // @ts-ignore
  const { fastestStructuralNote, fastestStacattoNote, fastestOrnamentalNote } = notesPerSecond as NotesPerSecond;

  if (!fastestStructuralNote && !fastestStacattoNote && !fastestOrnamentalNote) {
    throw new Error("No fastest notes per second property found in given section notesPerSecond");
  }

  const notes: Notes = {}
  // @ts-ignore
  Object.keys(notesPerSecond).forEach((note: keyof typeof notesPerSecond) => {
    if (notesPerSecond[note]) {
      // @ts-ignore
      notes[note] = getNote({ notesPerSecond: notesPerSecond[note], beatUnit, bpm, metreDenominator })
    }
  })

  return notes

 }

 function getNote({ notesPerSecond, beatUnit, bpm, metreDenominator }: { notesPerSecond: number, beatUnit: BEAT_UNIT, bpm: number, metreDenominator: number }): BEAT_UNIT {
   const beatUnitValue = noteDurationValue[beatUnit]; // ex: 1/4
   const beatDuration = 60 / bpm; // ex: 0.5
   const noteDuration = 1 / notesPerSecond; // ex: 0.125
   const numberOfNotesInSingleBeat = beatDuration / noteDuration; // ex: 0.5 / 0.125 = 4
   const noteValue = beatUnitValue / numberOfNotesInSingleBeat; // ex: 1/4 / 4 = 1/16
   // @ts-ignore
   const note = Object.keys(noteDurationValue).find((note) => noteDurationValue[note] === noteValue) as BEAT_UNIT;
   return note;
 }