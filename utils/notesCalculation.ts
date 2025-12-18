import { NOTE_VALUE } from "@/prisma/client/enums";

export const noteDurationValue = {
  WHOLE: 1,
  HALF: 1 / 2,
  DOTTED_HALF: 3 / 4,
  QUARTER: 1 / 4,
  DOTTED_QUARTER: 3 / 8,
  EIGHTH: 1 / 8,
  DOTTED_EIGHTH: 3 / 16,
  SIXTEENTH: 1 / 16,
  DOTTED_SIXTEENTH: 3 / 32,
  THIRTYSECOND: 1 / 32,
  DOTTED_THIRTYSECOND: 3 / 64,
  SIXTYFOURTH: 1 / 64,
  DOTTED_SIXTYFOURTH: 3 / 128,
  HUNDREDTWENTYEIGHTH: 1 / 128,
  DOTTED_HUNDREDTWENTYEIGHTH: 3 / 256,
  TRIPLET_EIGHTH: 1 / 12,
  TRIPLET_SIXTEENTH: 1 / 24,
  // TRIPLET_THIRTYSECOND: 1/48,
  // TRIPLET_SIXTYFOURTH: 1/96,
  QUADRUPLET_EIGHTH: 3 / 32,
  QUINTUPLET_SIXTEENTH: 1 / 20,
  QUINTUPLET_THIRTYSECOND: 1 / 40, // 5 thirtysecond = 1 eighth [Beethoven 4 - 1st movement]
  SEXTUPLET_SIXTEENTH: 1 / 24,
  SEXTUPLET_THIRTYSECOND: 1 / 48, // 6 sextuplet = 1 eighth [Beethoven 3 - 2nd movement]
  SEPTUPLET_SIXTEENTH: 1 / 28,
  SEPTUPLET_HUNDREDTWENTYEIGHTH: 1 / 112,
  //   OCTUPLET_SIXTEENTH: 1/32,
};
export const noteDurationValueKeys = Object.keys(
  noteDurationValue,
) as NOTE_VALUE[];

export type NoteValues = {
  fastestStructuralNoteValue?: NOTE_VALUE;
  fastestStaccatoNoteValue?: NOTE_VALUE;
  fastestOrnamentalNoteValue?: NOTE_VALUE;
};
export type NotesPerBarCollection = {
  fastestStructuralNotesPerBar?: number;
  fastestStaccatoNotesPerBar?: number;
  fastestOrnamentalNotesPerBar?: number;
  fastestRepeatedNotesPerBar?: number;
};
export type NotesPerSecondCollection = {
  fastestStructuralNotesPerSecond?: number;
  fastestStaccatoNotesPerSecond?: number;
  fastestOrnamentalNotesPerSecond?: number;
  fastestRepeatedNotesPerSecond?: number;
};

function logTestError(bpm, ...props) {
  if (bpm === 108) {
    console.log(props);
  }
}
