import getNotesPerBarFromNotesPerSecond from "@/lib/getNotesPerBarFromNotesPerSecond";
import { NOTE_VALUE } from "@prisma/client";

//   [gNPSFNPB RESULT] notesPerSecond: 2 | {"notesPerBar":4,"meterNumerator":4,"meterDenominator":4,"bpm":120,"beatUnit":"QUARTER"}
//   [gNPSFNPB RESULT] notesPerSecond: 1 | {"notesPerBar":3,"meterNumerator":6,"meterDenominator":8,"bpm":80,"beatUnit":"DOTTED_EIGHTH"}
//   [gNPSFNPB RESULT] notesPerSecond: 0.41666666666666663 | {"notesPerBar":3,"meterNumerator":3,"meterDenominator":4,"bpm":150,"beatUnit":"TRIPLET_SIXTEENTH"}

describe('getNotesPerBarFromNotesPerSecond', () => {

  it('should calculate the number of notes per bar correctly for a quarter note in a 4/4 time signature with 120 bpm', () => {
    const notesPerSecond = 2;
    const metreNumerator = 4;
    const metreDenominator = 4;
    const bpm = 120;
    const beatUnit = NOTE_VALUE.QUARTER;

    const result = getNotesPerBarFromNotesPerSecond({notesPerSecond, beatUnit, bpm, metreNumerator, metreDenominator});
    expect(result).toBeCloseTo(4, 1);
  });

  it('should calculate the number of notes per bar correctly for a dotted eighth note in a 6/8 time signature with 80 bpm', () => {
    const notesPerSecond = 1;
    const metreNumerator = 6;
    const metreDenominator = 8;
    const bpm = 80;
    const beatUnit = NOTE_VALUE.DOTTED_EIGHTH; // 3/16

    const result = getNotesPerBarFromNotesPerSecond({notesPerSecond, beatUnit, bpm, metreNumerator, metreDenominator});
    expect(result).toBeCloseTo(3, 1);
  });

  it('should calculate the number of notes per bar correctly for a triplet sixteenth note in a 3/4 time signature with 150 bpm', () => {
    const notesPerSecond = 0.41;
    const metreNumerator = 3;
    const metreDenominator = 4;
    const bpm = 150; // 0.4 seconds per beat
    const beatUnit = NOTE_VALUE.TRIPLET_SIXTEENTH; // 1/24

    const result = getNotesPerBarFromNotesPerSecond({notesPerSecond, beatUnit, bpm, metreNumerator, metreDenominator});
    expect(result).toBeCloseTo(3, 1);
  });

  // Tests that the function throws an error when the notesPerSecond parameter is zero.
  it('should throw an error when the notesPerSecond parameter is zero', () => {
    expect(() => {
      getNotesPerBarFromNotesPerSecond({notesPerSecond: 0, beatUnit: NOTE_VALUE.QUARTER, bpm: 120, metreNumerator: 4, metreDenominator: 4});
    }).toThrow("[Invalid parameter] All parameters are required and must be greater than zero.");
  });

  // Tests that the function throws an error when the metreNumerator parameter is zero.
  it('should throw an error when the metreNumerator parameter is zero', () => {
    expect(() => {
      getNotesPerBarFromNotesPerSecond({notesPerSecond: 2, beatUnit: NOTE_VALUE.QUARTER, bpm: 120, metreNumerator: 0, metreDenominator: 4});
    }).toThrow("[Invalid parameter] All parameters are required and must be greater than zero.");
  });

  // Tests that the function throws an error when the metreDenominator parameter is zero.
  it('should throw an error when the metreDenominator parameter is zero', () => {
    expect(() => {
      getNotesPerBarFromNotesPerSecond({notesPerSecond: 2, beatUnit: NOTE_VALUE.QUARTER, bpm: 120, metreNumerator: 4, metreDenominator: 0});
    }).toThrow("[Invalid parameter] All parameters are required and must be greater than zero.");
  });

});
