import { NOTE_VALUE } from "@prisma/client";

export default function getNoteValueLabel(noteValue: NOTE_VALUE) {
  switch (noteValue) {
    case NOTE_VALUE.WHOLE:
      return "Whole";
    case NOTE_VALUE.HALF:
      return "Half";
    case NOTE_VALUE.DOTTED_HALF:
      return "Dotted Half";
    case NOTE_VALUE.QUARTER:
      return "Quarter";
    case NOTE_VALUE.DOTTED_QUARTER:
      return "Dotted Quarter";
    case NOTE_VALUE.EIGHTH:
      return "Eighth";
    case NOTE_VALUE.DOTTED_EIGHTH:
      return "Dotted Eighth";
    case NOTE_VALUE.SIXTEENTH:
      return "Sixteenth";
    case NOTE_VALUE.DOTTED_SIXTEENTH:
      return "Dotted Sixteenth";
    case NOTE_VALUE.THIRTYSECOND:
      return "Thirty-second";
    case NOTE_VALUE.DOTTED_THIRTYSECOND:
      return "Dotted Thirty-second";
    default:
      throw new Error(`Unknown note value: ${noteValue}`);
  }
}
