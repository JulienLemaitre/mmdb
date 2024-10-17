import { db } from "@/utils/db";
import { FeedFormState } from "@/components/context/feedFormContext";
import { assertsIsPersistableFeedFormState } from "@/types/formTypes";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import getMMSourceAndRelatedEntitiesDBInputFromState from "@/utils/getMMSourceAndRelatedEntitiesDBInputFromState";
import getMetronomeMarkDBInputFromState from "@/utils/getMetronomeMarkDBInputFromState";
import isReqAuthorized from "@/utils/isReqAuthorized";
import getDecodedTokenFromReq from "@/utils/getDecodedTokenFromReq";
import getCollectionCreateInput from "@/utils/getCollectionCreateInput";
import getComposerCreateInput from "@/utils/getComposerCreateInput";

export async function POST(request: NextRequest) {
  if (!isReqAuthorized(request)) {
    return NextResponse.json({ error: `Unauthorized` }, { status: 401 });
  }

  const decodedToken = await getDecodedTokenFromReq(request);
  const creatorId = decodedToken?.id;
  if (!creatorId) {
    return NextResponse.json(
      { error: `No authorized creator found` },
      { status: 401 },
    );
  }

  const state = (await request.json()) as FeedFormState;
  console.log(
    `[feedForm API route] body (FeedFormState) :`,
    JSON.stringify(state),
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

  // We need to persist new composers first, as it is used by collection and mMSource queries below
  const composerCreateManyInput: Prisma.PersonCreateManyInput[] =
    getComposerCreateInput(state, creatorId);
  console.log(
    `[] composerCreateManyInput`,
    JSON.stringify(composerCreateManyInput, null, 2),
  );

  const collectionCreateManyInput: Prisma.CollectionCreateManyInput[] =
    getCollectionCreateInput(state, creatorId);

  console.log(
    `[] collectionCreateManyInput`,
    JSON.stringify(collectionCreateManyInput, null, 2),
  );

  const mMSourceInput: Prisma.MMSourceCreateInput =
    getMMSourceAndRelatedEntitiesDBInputFromState(state, creatorId);

  console.log(`[] mMSourceInput`, JSON.stringify(mMSourceInput));

  // Execute all operations in a single transaction
  return await db
    .$transaction(async (tx) => {
      const composers = await tx.person.createMany({
        data: composerCreateManyInput,
      });
      console.log(`[] composers :`, JSON.stringify(composers));

      const collections = await tx.collection.createMany({
        data: collectionCreateManyInput,
      });
      console.log(`[] collections :`, JSON.stringify(collections));

      const mMSource = await tx.mMSource.create({
        data: mMSourceInput,
      });

      console.log(`[] mMSource :`, JSON.stringify(mMSource));
      const mMSourceId = mMSource.id;
      console.log(`[] mMSourceId :`, mMSourceId);

      const metronomeMarksInput: Prisma.MetronomeMarkCreateManyInput[] =
        state.metronomeMarks
          .filter((metronomeMark) => !metronomeMark.noMM)
          .map((metronomeMark) =>
            getMetronomeMarkDBInputFromState(metronomeMark, mMSourceId),
          );

      console.log(
        `[] metronomeMarksInput sectionId`,
        metronomeMarksInput.map((m) => m.sectionId),
      );

      const metronomeMarks = await tx.metronomeMark.createMany({
        data: metronomeMarksInput,
      });

      console.log(`[] metronomeMarks :`, metronomeMarks);

      return { mMSourceInput, mMSource, metronomeMarks };
    })
    .then(async (results) => {
      // Fetch info for newly registered mMSource
      const mMSourceFromDb = await db.mMSource.findUnique({
        where: { id: results.mMSource.id },
        include: {
          references: true,
          contributions: {
            include: {
              person: true,
              organization: true,
            },
          },
          pieceVersions: {
            include: {
              pieceVersion: {
                include: {
                  piece: {
                    include: {
                      composer: true,
                      collection: true,
                    },
                  },
                  movements: {
                    include: {
                      sections: {
                        include: {
                          tempoIndication: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          metronomeMarks: true,
        },
      });

      const mMSourceFromDBWithMMs = mMSourceFromDb
        ? {
            ...mMSourceFromDb,
            pieceVersions: mMSourceFromDb.pieceVersions.map((pvs) => ({
              ...pvs,
              pieceVersion: {
                ...pvs.pieceVersion,
                movements: pvs.pieceVersion.movements.map((mv) => ({
                  ...mv,
                  sections: mv.sections.map((section) => ({
                    ...section,
                    metronomeMarks: mMSourceFromDb.metronomeMarks.filter(
                      (mm) => mm.sectionId === section.id,
                    ),
                  })),
                })),
              },
            })),
          }
        : null;

      console.log(
        `[] mMSourceFromDBWithMMs`,
        JSON.stringify(mMSourceFromDBWithMMs),
      );

      return NextResponse.json({
        ...results,
        mMSourceFromDb: mMSourceFromDBWithMMs,
      });
    })
    .catch((error) => {
      return NextResponse.json(
        { error: `Error during DB persistence: ${error.message}` },
        { status: 500 },
      );
    });
}
