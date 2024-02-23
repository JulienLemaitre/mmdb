import getNotesPerBarFromNotesPerSecond from "./getNotesPerBarFromNotesPerSecond";
import { NOTE_VALUE } from "@prisma/client";

//   [gNPSFNPB RESULT] notesPerSecond: 2 | {"notesPerBar":4,"meterNumerator":4,"meterDenominator":4,"bpm":120,"beatUnit":"QUARTER"}
//   [gNPSFNPB RESULT] notesPerSecond: 1 | {"notesPerBar":3,"meterNumerator":6,"meterDenominator":8,"bpm":80,"beatUnit":"DOTTED_EIGHTH"}
//   [gNPSFNPB RESULT] notesPerSecond: 0.41666666666666663 | {"notesPerBar":3,"meterNumerator":3,"meterDenominator":4,"bpm":150,"beatUnit":"TRIPLET_SIXTEENTH"}

describe("getNotesPerBarFromNotesPerSecond", () => {
  it("should calculate the number of notes per bar correctly for a quarter note in a 4/4 time signature with 120 bpm", () => {
    const notesPerSecond = 2;
    const metreNumerator = 4;
    const metreDenominator = 4;
    const bpm = 120;
    const beatUnit = NOTE_VALUE.QUARTER;

    const result = getNotesPerBarFromNotesPerSecond({
      notesPerSecond,
      beatUnit,
      bpm,
      metreNumerator,
      metreDenominator,
    });
    expect(result).toBeCloseTo(4, 1);
  });

  it("should calculate the number of notes per bar correctly for a dotted eighth note in a 6/8 time signature with 80 bpm", () => {
    const notesPerSecond = 1;
    const metreNumerator = 6;
    const metreDenominator = 8;
    const bpm = 80;
    const beatUnit = NOTE_VALUE.DOTTED_EIGHTH; // 3/16

    const result = getNotesPerBarFromNotesPerSecond({
      notesPerSecond,
      beatUnit,
      bpm,
      metreNumerator,
      metreDenominator,
    });
    expect(result).toBeCloseTo(3, 1);
  });
});
