import { db } from "@/utils/db";
import { FeedFormState } from "@/components/context/feedFormContext";
import {
  assertsIsPersistableFeedFormState,
  OrganizationState,
  PersonState,
  PieceState,
  PieceVersionState,
  TempoIndicationState,
} from "@/types/formTypes";
import {
  Movement,
  Organization,
  Person,
  PieceVersion,
  PrismaPromise,
  Section,
} from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const state = (await request.json()) as FeedFormState;
  console.log(
    `[feedForm API route] body (FeedFormState) :`,
    JSON.stringify(state, null, 2),
  );

  // Checking mandatory fields
  const mandatoryFields = [
    "mMSourceDescription",
    "mMSourceContributions",
    "mMSourcePieceVersions",
    "metronomeMarks",
  ];
  const missingMandatoryFields = mandatoryFields.filter(
    (field) => !state[field] || state[field].length === 0,
  );
  if (missingMandatoryFields.length > 0) {
    return new Response(
      JSON.stringify({
        error: `Missing mandatory fields: ${missingMandatoryFields}`,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Type guard
  assertsIsPersistableFeedFormState(state);

  // 1 - gather new persons to persist from mMSourceContributions and piece composers
  const newPersonsFromSourceContributions: PersonState[] = [];
  state.mMSourceContributions.forEach((contribution) => {
    if ("person" in contribution && contribution.person.isNew) {
      const newPerson = contribution.person;
      delete newPerson.isNew;
      newPersonsFromSourceContributions.push(contribution.person);
    }
  });

  // 2 - Gather new persons, pieces and pieceVersions to persist from mMSourcePieceVersions
  const newPieces: PieceState[] = [];
  const newPieceVersions: PieceVersionState[] = [];
  const newTempoIndications: TempoIndicationState[] = [];
  const newPersonsFromPieceComposers: PersonState[] = [];
  state.mMSourcePieceVersions.forEach((mMSourceOnPieceVersion) => {
    // If a composer is new, so is the piece and pieceVersion
    const { pieceVersionId } = mMSourceOnPieceVersion;
    const pieceVersion = state.pieceVersions.find(
      (pieceVersion) =>
        pieceVersion.id === pieceVersionId && pieceVersion.isNew,
    );
    if (!pieceVersion) return;
    // New PieceVersion
    delete pieceVersion.isNew;
    newPieceVersions.push(pieceVersion);

    // Having a new pieceVersion, we check if there is new tempoIndications to persist
    pieceVersion.movements.forEach((movement) => {
      movement.sections.forEach((section) => {
        const newTempoIndication = state.tempoIndications.find(
          (tempoIndication) =>
            tempoIndication.id === section.tempoIndication.id &&
            tempoIndication.isNew,
        );
        if (newTempoIndication) {
          // New tempoIndication
          delete newTempoIndication.isNew;
          newTempoIndications.push(newTempoIndication);
        }
      });
    });

    const { pieceId } = pieceVersion;
    const piece = state.pieces.find(
      (piece) => piece.id === pieceId && piece.isNew,
    );
    if (!piece) return;
    // New Piece
    delete piece.isNew;
    newPieces.push(piece);
    const { composerId } = piece;
    const newPerson = state.persons.find(
      (person) => person.id === composerId && person.isNew,
    );
    if (newPerson) {
      // New person
      delete newPerson.isNew;
      newPersonsFromPieceComposers.push(newPerson);
    }
  });

  const newPersons = [
    ...newPersonsFromSourceContributions,
    ...newPersonsFromPieceComposers,
  ];

  // 3 - gather new organizations to persist from mMSourceContributions
  const newOrganizations: OrganizationState[] = [];
  state.mMSourceContributions.forEach((contribution) => {
    if ("organization" in contribution && contribution.organization.isNew) {
      const newOrganization = contribution.organization;
      delete newOrganization.isNew;
      newOrganizations.push(contribution.organization);
    }
  });

  console.group(`feedForm API route]`);
  console.log(`[] newPersons :`, newPersons);
  console.log(`[] newOrganizations :`, newOrganizations);
  console.log(`[] newPieces :`, newPieces);
  console.log(`[] newPieceVersions :`, newPieceVersions);
  console.log(`[] newTempoIndications :`, newTempoIndications);
  console.groupEnd();

  // 4 - Persist
  type SelectedPieceVersion = Pick<PieceVersion, "id" | "category"> & {
    movements: Omit<Movement, "createdAt" | "updatedAt" | "pieceVersionId">[];
  };
  type Operation =
    | Person
    | Organization
    | Section
    | Movement
    | SelectedPieceVersion;
  const operations: PrismaPromise<Operation>[] = [];

  // Persons
  operations.push(
    ...newPersons.map((person) => db.person.create({ data: person })),
  );

  // Organizations
  operations.push(
    ...newOrganizations.map((organization) =>
      db.organization.create({ data: organization }),
    ),
  );

  // Execute all operations in a single transaction
  const results = await db.$transaction(operations);

  return NextResponse.json(results);
}

const exampleBody = {
  formInfo: {
    currentStepRank: 5,
    introDone: true,
    isSourceOnPieceVersionformOpen: false,
    allSourcePieceVersionsDone: true,
  },
  mMSourceDescription: {
    id: undefined,
    title: "The Edition",
    year: 1845,
    type: "EDITION",
    link: "https://the.link",
    comment: "Whouah",
    references: [
      {
        type: "ISBN",
        reference: "ezfezrf-46546",
      },
    ],
    isNew: true,
  },
  mMSourceContributions: [
    {
      person: {
        id: "94a3a633-3195-4d28-9ee4-0891683e9dc2",
        birthYear: 1846,
        deathYear: 1912,
        firstName: "Smart",
        lastName: "Guy",
        isNew: true,
      },
      role: "TRANSLATOR",
    },
    {
      organization: {
        id: "db9226b7-cb85-41ac-bba0-7fd3f7f95950",
        name: "Great Company",
        isNew: true,
      },
      role: "PUBLISHER",
    },
    {
      person: {
        id: "4aa7131f-371d-4ae7-a61e-594b9f1e2ec7",
        firstName: "Antonín",
        lastName: "Dvořák",
        birthYear: 1841,
        deathYear: 1904,
      },
      role: "MM_PROVIDER",
    },
  ],
  mMSourcePieceVersions: [
    {
      pieceVersionId: "9ba201b0-2170-432a-99dc-9fd17c0a7474",
      rank: 1,
    },
    {
      pieceVersionId: "ff9c8f5e-aa7d-49ae-82d7-e87cac64adb5",
      rank: 2,
    },
  ],
  organizations: [
    {
      id: "db9226b7-cb85-41ac-bba0-7fd3f7f95950",
      name: "Great Company",
      isNew: true,
    },
  ],
  persons: [
    {
      id: "94a3a633-3195-4d28-9ee4-0891683e9dc2",
      birthYear: 1846,
      deathYear: 1912,
      firstName: "Smart",
      lastName: "Guy",
      isNew: true,
    },
    {
      firstName: "Peter",
      lastName: "Pan",
      birthYear: 1645,
      deathYear: 1720,
      id: "bef51ac1-033d-48d0-939c-785b88b67ced",
      isNew: true,
    },
  ],
  pieces: [
    {
      title: "Jump",
      nickname: "Ju",
      yearOfComposition: 1653,
      composerId: "bef51ac1-033d-48d0-939c-785b88b67ced",
      id: "d102c769-66a9-4195-90a6-bb9da661147d",
      isNew: true,
    },
  ],
  pieceVersions: [
    {
      category: "VOCAL",
      movements: [
        {
          id: "movements[0].id",
          rank: 1,
          key: "F_SHARP_MAJOR",
          sections: [
            {
              id: "movements[0].sections[0].id",
              rank: 1,
              metreNumerator: 2,
              metreDenominator: 2,
              isCommonTime: false,
              isCutTime: true,
              fastestStructuralNotesPerBar: 32,
              isFastestStructuralNoteBelCanto: false,
              fastestStaccatoNotesPerBar: NaN,
              fastestRepeatedNotesPerBar: NaN,
              fastestOrnamentalNotesPerBar: NaN,
              comment: "",
              tempoIndication: {
                id: "b1904946-a26e-47b5-b359-fd36dc48d23b",
                text: "Piu sostenuto",
              },
            },
            {
              id: "movements[0].sections[1].id",
              rank: 2,
              metreNumerator: 4,
              metreDenominator: 4,
              isCommonTime: true,
              isCutTime: false,
              fastestStructuralNotesPerBar: 32,
              isFastestStructuralNoteBelCanto: true,
              fastestStaccatoNotesPerBar: 15,
              fastestRepeatedNotesPerBar: 16,
              fastestOrnamentalNotesPerBar: 18,
              comment: "Great!!",
              tempoIndication: {
                id: "a91a73d0-3691-4326-957b-e1f1fb8daae1",
                text: "rapido",
              },
            },
          ],
        },
      ],
      pieceId: "d102c769-66a9-4195-90a6-bb9da661147d",
      id: "ff9c8f5e-aa7d-49ae-82d7-e87cac64adb5",
      isNew: true,
    },
  ],
  metronomeMarks: [
    {
      sectionId: "movements[0].sections[0].id",
      bpm: 64,
      comment: undefined,
      beatUnit: "HALF",
    },
    {
      sectionId: "39a6cdff-13e9-4553-a9e0-683537ca6ab8",
      bpm: 113,
      comment: undefined,
      beatUnit: "QUARTER",
    },
    {
      sectionId: "movements[0].sections[1].id",
      bpm: 95,
      comment: undefined,
      beatUnit: "DOTTED_HALF",
    },
  ],
  tempoIndications: [
    {
      id: "a91a73d0-3691-4326-957b-e1f1fb8daae1",
      text: "rapido",
      isNew: true,
    },
  ],
};
