import { NOTE_VALUE } from "@/prisma/client/enums";
import { noteDurationValue } from "./notesCalculation";

/**
 * Calculates the number of notes per second that must be executed, from the given number of notes per bar, beat unit and bpm.
 * @param notesPerBar
 * @param metreNumerator
 * @param metreDenominator
 * @param beatUnit
 * @param bpm
 */
export default function getNotesPerSecondFromNotesPerBar({
  notesPerBar,
  metreNumerator,
  metreDenominator,
  bpm,
  beatUnit,
}: {
  notesPerBar: number;
  metreNumerator: number;
  metreDenominator: number;
  bpm: number;
  beatUnit: NOTE_VALUE;
}): number {
  if (
    !notesPerBar ||
    !metreNumerator ||
    !metreDenominator ||
    !bpm ||
    !beatUnit
  ) {
    // console.log(`[] ERROR :`, {
    //   notesPerBar,
    //   metreNumerator,
    //   metreDenominator,
    //   bpm,
    //   beatUnit,
    // });
    throw new Error(
      `[gNPSFNPB] Invalid or missing parameter: ${JSON.stringify({
        notesPerBar,
        metreNumerator,
        metreDenominator,
        bpm,
        beatUnit,
      })}`,
    );
  }
  // Calculate the duration of one beat in seconds
  const beatDuration = 60 / bpm;

  // Get the rhythmic value of a single beat and the given structural note
  const beatUnitValue = noteDurationValue[beatUnit]; // ex: 1/4

  // Calculate the duration of one bar in seconds
  const secondsPerBar =
    (beatDuration * (metreNumerator / metreDenominator)) / beatUnitValue;

  // Calculate the notes per second
  const notesPerSecond = notesPerBar / secondsPerBar;

  // const isTest = notesPerBar === 4 && metreNumerator === 4 && metreDenominator === 4 && bpm === 120 && beatUnit === NOTE_VALUE.QUARTER; // 1/24
  const isTest = false;
  if (isTest) {
    console.group(`[TEST gNPSFNPB]`);
    console.log(`beatDuration :`, beatDuration);
    console.log(`beatUnitValue :`, beatUnitValue);
    console.log(`secondsPerBar :`, secondsPerBar);
    console.log(`notesPerSecond :`, notesPerSecond);
    console.groupEnd();
  }
  // console.log(
  //   `[gNPSFNPB RESULT] notesPerSecond: ${notesPerSecond} |`,
  //   JSON.stringify({
  //     notesPerBar,
  //     metreNumerator,
  //     metreDenominator,
  //     bpm,
  //     beatUnit,
  //   }),
  // );
  return notesPerSecond;
}
