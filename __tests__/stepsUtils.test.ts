import { KEY } from "@/prisma/client";

jest.mock(
  "@/features/feed/multiStepMMSourceForm/stepForms/Intro",
  () => () => null,
);
jest.mock(
  "@/features/feed/multiStepMMSourceForm/stepForms/MMSourceDescription",
  () => () => null,
);
jest.mock(
  "@/features/feed/multiStepMMSourceForm/stepForms/MMSourceContributions",
  () => () => null,
);
jest.mock(
  "@/features/feed/multiStepMMSourceForm/stepForms/MMSourceOnPieceVersions",
  () => () => null,
);
jest.mock(
  "@/features/feed/multiStepMMSourceForm/stepForms/MetronomeMarks",
  () => () => null,
);
jest.mock(
  "@/features/feed/multiStepMMSourceForm/stepForms/FeedSummary",
  () => () => null,
);

import { areMetronomeMarksCompleteForSections } from "@/features/feed/multiStepMMSourceForm/stepsUtils";
import { FeedFormState } from "@/types/feedFormTypes";
import { SectionStateExtendedForMMForm } from "@/types/formTypes";
import { NOTE_VALUE } from "@/prisma/client/enums";

const TEMPO_INDICATION_ID_1 = "6715cf0b-4228-4746-afc3-77b2bd923661";
const TEMPO_INDICATION_ID_2 = "c85f2914-ff40-4125-90a9-a9ed7799e4e6";

describe("areMetronomeMarksCompleteForSections", () => {
  const section1: SectionStateExtendedForMMForm = {
    id: "sec-1",
    rank: 0,
    movement: { id: "mov-1", rank: 0, key: KEY.D_MAJOR, isVariation: false },
    mMSourceOnPieceVersion: { rank: 0, pieceVersionId: "pv-1" },
    pieceId: "p-1",
    tempoIndication: undefined,
    metreNumerator: 4,
    metreDenominator: 4,
    fastestStructuralNotesPerBar: 10,
    tempoIndicationId: TEMPO_INDICATION_ID_1,
  };

  const section2: SectionStateExtendedForMMForm = {
    id: "sec-2",
    rank: 1,
    movement: {
      id: "mov-1",
      rank: 0,
      key: KEY.A_SHARP_MAJOR,
      isVariation: false,
    },
    mMSourceOnPieceVersion: { rank: 0, pieceVersionId: "pv-1" },
    pieceId: "p-1",
    tempoIndication: undefined,
    metreNumerator: 2,
    metreDenominator: 2,
    fastestStructuralNotesPerBar: 20,
    tempoIndicationId: TEMPO_INDICATION_ID_2,
  };

  const sectionList = [section1, section2];

  it("returns true when sections without marks have noMM: true and at least one section has a real mark", () => {
    const state: FeedFormState = {
      metronomeMarks: [
        {
          id: "mm-1",
          sectionId: "sec-1",
          beatUnit: NOTE_VALUE.QUARTER,
          bpm: 120,
          pieceVersionId: "pv-1",
          noMM: false,
        },
        {
          sectionId: "sec-2",
          pieceVersionId: "pv-1",
          noMM: true,
        },
      ],
    };

    expect(areMetronomeMarksCompleteForSections(state, sectionList)).toBe(true);
  });

  it("returns false when all sections have noMM: true (no real mark)", () => {
    const state: FeedFormState = {
      metronomeMarks: [
        {
          sectionId: "sec-1",
          pieceVersionId: "pv-1",
          noMM: true,
        },
        {
          sectionId: "sec-2",
          pieceVersionId: "pv-1",
          noMM: true,
        },
      ],
    };

    expect(areMetronomeMarksCompleteForSections(state, sectionList)).toBe(
      false,
    );
  });

  it("returns false when a section has no metronome mark entry at all", () => {
    const state: FeedFormState = {
      metronomeMarks: [
        {
          id: "mm-1",
          sectionId: "sec-1",
          beatUnit: NOTE_VALUE.QUARTER,
          bpm: 120,
          pieceVersionId: "pv-1",
          noMM: false,
        },
      ],
    };

    expect(areMetronomeMarksCompleteForSections(state, sectionList)).toBe(
      false,
    );
  });
});
