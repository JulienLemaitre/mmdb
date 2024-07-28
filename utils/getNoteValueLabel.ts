import { NOTE_VALUE } from "@prisma/client";

export default function getNoteValueLabel(noteValue: NOTE_VALUE) {
  switch (noteValue) {
    case NOTE_VALUE.WHOLE:
      return "Whole Note";
    case NOTE_VALUE.HALF:
      return "Half Note";
    case NOTE_VALUE.DOTTED_HALF:
      return "Dotted Half Note";
    case NOTE_VALUE.QUARTER:
      return "Quarter Note";
    case NOTE_VALUE.DOTTED_QUARTER:
      return "Dotted Quarter Note";
    case NOTE_VALUE.EIGHTH:
      return "Eighth Note";
    case NOTE_VALUE.DOTTED_EIGHTH:
      return "Dotted Eighth Note";
    case NOTE_VALUE.SIXTEENTH:
      return "Sixteenth Note";
    case NOTE_VALUE.DOTTED_SIXTEENTH:
      return "Dotted Sixteenth Note";
    case NOTE_VALUE.THIRTYSECOND:
      return "Thirty-second Note";
    case NOTE_VALUE.DOTTED_THIRTYSECOND:
      return "Dotted Thirty-second Note";
    default:
      throw new Error(`Unknown note value: ${noteValue}`);
  }
}
