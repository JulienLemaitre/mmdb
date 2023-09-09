import {noteDurationValue} from "@/lib/notesCalculation";
import {NOTE_VALUE} from "@prisma/client";

/**
 * Calculates the number of notes per bar that must be executed, from the given number of notes per second, beat unit and bpm.
 * @param notesPerSecond
 * @param beatUnit
 * @param bpm
 * @param metreNumerator
 * @param metreDenominator
 */
export default function getNotesPerBarFromNotesPerSecond({notesPerSecond, beatUnit, bpm, metreNumerator, metreDenominator}:{ notesPerSecond: number, metreNumerator: number, metreDenominator: number, bpm: number, beatUnit: NOTE_VALUE }): number {
  if (!notesPerSecond || !metreNumerator || !metreDenominator || !bpm || !beatUnit) {
    throw new Error("[Invalid parametre] All parametres are required and must be greater than zero.");
  }

  // Calculate the duration of one beat in seconds
  const beatDuration = 60 / bpm;

  // Get the rhythmic value of a single beat and the given structural note
  const beatUnitValue = noteDurationValue[beatUnit]; // ex: 1/4

  // Calculate the duration of one bar in seconds
  const secondsPerBar = beatDuration * (metreNumerator / metreDenominator) / beatUnitValue;

  // Calculate the notes per bar
  const notesPerBar = notesPerSecond * secondsPerBar;

  // const isTest = notesPerBar === 4 && metreNumerator === 4 && metreDenominator === 4 && bpm === 120 && beatUnit === NOTE_VALUE.QUARTER; // 1/24
  const isTest = false
  if (isTest) {
    console.group(`[TEST gNPSFNPB]`)
    console.log(`beatDuration :`, beatDuration)
    console.log(`beatUnitValue :`, beatUnitValue)
    console.log(`secondsPerBar :`, secondsPerBar)
    console.log(`notesPerBar :`, notesPerBar)
    console.groupEnd()
  }
  console.log(`[gNPSFNPB RESULT] notesPerBar: ${notesPerBar} |`, JSON.stringify({ notesPerSecond, metreNumerator, metreDenominator, bpm, beatUnit }))

  return notesPerBar;
}


function calculateNotesPerBar(notesPerSecond: number, metreNumerator: number, metreDenominator: number, bpm: number, beatUnit: number): number {
  // Calculate the duration of one beat in seconds
  const secondsPerBeat = 60 / bpm;

  // Calculate the duration of one bar in seconds
  const secondsPerBar = secondsPerBeat * (metreNumerator / metreDenominator) * beatUnit;

  // Calculate the notes per bar
  const notesPerBar = notesPerSecond * secondsPerBar;

  return notesPerBar;
}
