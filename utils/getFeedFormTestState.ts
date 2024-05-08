import { v4 as uuidv4 } from "uuid";
import { FeedFormState } from "@/components/context/feedFormContext";

export default function getFeedFormTestState() {
  // If we are server-side, return null
  if (typeof window === "undefined") {
    return null;
  }

  const newOrgId = uuidv4();
  const newPersonId = uuidv4();
  const newPersonId2 = uuidv4();
  const newPieceId = uuidv4();
  const newPieceVersionId = uuidv4();
  const newTempoIndicationId = uuidv4();
  const newTempoIndicationId2 = uuidv4();

  return {
    formInfo: {
      currentStepRank: 5,
      introDone: true,
      isSourceOnPieceVersionformOpen: false,
      allSourcePieceVersionsDone: true,
    },
    mMSourceDescription: {
      id: undefined,
      title: "Top Edition",
      year: 1864,
      type: "EDITION",
      link: "https://super.piece",
      comment: "Wouhaou",
      references: [
        {
          type: "PLATE_NUMBER",
          reference: "484-erfer",
        },
        {
          type: "ISBN",
          reference: "468464-efrerf",
        },
      ],
      isNew: true,
    },
    mMSourceContributions: [
      {
        organization: {
          id: "c6125dab-3957-4b6e-aa43-218538318a4e",
          name: "C.F. Peters",
        },
        role: "EDITOR",
      },
      {
        person: {
          id: newPersonId,
          birthYear: 1945,
          deathYear: 2005,
          firstName: "Incroyable",
          lastName: "Man",
          isNew: true,
        },
        role: "TRANSCRIBER",
      },
      {
        organization: {
          id: newOrgId,
          name: "Smart Society",
          isNew: true,
        },
        role: "PUBLISHER",
      },
    ],
    mMSourcePieceVersions: [
      {
        pieceVersionId: "a264922e-7042-452d-abba-7375c601ad5b",
        rank: 1,
      },
      {
        pieceVersionId: newPieceVersionId,
        rank: 2,
      },
    ],
    organizations: [
      {
        id: newOrgId,
        name: "Smart Society",
        isNew: true,
      },
    ],
    persons: [
      {
        id: newPersonId,
        birthYear: 1945,
        deathYear: 2005,
        firstName: "Incroyable",
        lastName: "Man",
        isNew: true,
      },
      {
        firstName: "Jojo",
        lastName: "LeBon",
        birthYear: 1898,
        deathYear: 1967,
        id: newPersonId2,
        isNew: true,
      },
    ],
    pieces: [
      {
        title: "La First",
        nickname: "First",
        yearOfComposition: 1923,
        composerId: newPersonId2,
        id: newPieceId,
        isNew: true,
      },
    ],
    pieceVersions: [
      {
        category: "KEYBOARD",
        movements: [
          {
            id: "movements[0].id",
            rank: 1,
            key: "G_MAJOR",
            sections: [
              {
                id: "movements[0].sections[0].id",
                rank: 1,
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 32,
                isFastestStructuralNoteBelCanto: false,
                fastestStaccatoNotesPerBar: NaN,
                fastestRepeatedNotesPerBar: NaN,
                fastestOrnamentalNotesPerBar: NaN,
                comment: "",
                tempoIndication: {
                  id: newTempoIndicationId,
                  text: "rapido",
                },
              },
              {
                id: "movements[0].sections[1].id",
                rank: 2,
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 12,
                isFastestStructuralNoteBelCanto: true,
                fastestStaccatoNotesPerBar: 14,
                fastestRepeatedNotesPerBar: 7,
                fastestOrnamentalNotesPerBar: 24,
                comment: "Rapide !",
                tempoIndication: {
                  id: "7c555d45-bd87-41f3-93f7-00327bd04873",
                  text: "Adagio",
                },
              },
            ],
          },
          {
            id: "movements[1].id",
            rank: 2,
            key: "E_FLAT_MAJOR",
            sections: [
              {
                id: "movements[1].sections[0].id",
                rank: 1,
                metreNumerator: 2,
                metreDenominator: 2,
                isCommonTime: false,
                isCutTime: true,
                fastestStructuralNotesPerBar: 18,
                isFastestStructuralNoteBelCanto: false,
                fastestStaccatoNotesPerBar: NaN,
                fastestRepeatedNotesPerBar: NaN,
                fastestOrnamentalNotesPerBar: NaN,
                comment: "",
                tempoIndication: {
                  id: newTempoIndicationId2,
                  text: "top",
                },
              },
            ],
          },
        ],
        pieceId: newPieceId,
        id: newPieceVersionId,
        isNew: true,
      },
    ],
    metronomeMarks: [
      {
        sectionId: "movements[0].sections[0].id",
        bpm: 64,
        comment: "",
        beatUnit: "HALF",
      },
      {
        sectionId: "acb64690-99f7-432d-9e51-425a9d0a2770",
        bpm: 80,
        comment: "",
        beatUnit: "WHOLE",
      },
      {
        sectionId: "movements[0].sections[1].id",
        bpm: 108,
        comment: "",
        beatUnit: "QUARTER",
      },
      {
        sectionId: "movements[1].sections[0].id",
        bpm: 86,
        comment: "Lalala",
        beatUnit: "EIGHTH",
      },
    ],
    tempoIndications: [
      {
        id: newTempoIndicationId,
        text: "rapido",
        isNew: true,
      },
      {
        id: newTempoIndicationId2,
        text: "top",
        isNew: true,
      },
    ],
  } as FeedFormState;
}
