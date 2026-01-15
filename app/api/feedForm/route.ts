import { db } from "@/utils/server/db";
import { assertsIsPersistableFeedFormState } from "@/types/formTypes";
import { Prisma } from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import getMMSourceAndRelatedEntitiesDBInputFromState from "@/utils/getMMSourceAndRelatedEntitiesDBInputFromState";
import getMetronomeMarkDBInputFromState from "@/utils/getMetronomeMarkDBInputFromState";
import isReqAuthorized from "@/utils/server/isReqAuthorized";
import getDecodedTokenFromReq from "@/utils/server/getDecodedTokenFromReq";
import getCollectionCreateInput from "@/utils/getCollectionCreateInput";
import getPersonCreateInput from "@/utils/getPersonCreateInput";
import getOrganizationCreateInput from "@/utils/getOrganizationCreateInput";
import { fetchAPI } from "@/utils/fetchAPI";
import getAccessTokenFromReq from "@/utils/server/getAccessTokenFromReq";
import { FeedFormState } from "@/types/feedFormTypes";

/**
 * Handles the POST request to persist a feed form state into the database, including related entities such as composers, organizations,
 * collections, metronome marks, and MM Source data. This method also performs necessary validation, logs the request, and sends notification emails.
 *
 * @param {NextRequest} request - The incoming HTTP request object containing the feed form state and authorization token.
 * @return {Promise<NextResponse>} A response indicating the success or failure of the operation. Potential responses include:
 * - 401 Unauthorized if the request lacks proper authorization.
 * - 400 Bad Request if mandatory fields are missing.
 * - 500 Internal Server Error if a database transaction fails.
 * - 200 OK along with the persisted entities upon successful completion.
 */
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
  console.log(`[feedForm API route] ---------- BEGIN ----------`);
  console.log(`[api/feedForm] state`, JSON.stringify(state));

  // Checking mandatory fields
  const mandatoryFields = [
    "mMSourceDescription",
    "mMSourceContributions",
    "mMSourceOnPieceVersions",
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
  const personCreateManyInput: Prisma.PersonCreateManyInput[] =
    getPersonCreateInput(state, creatorId);

  const organizationCreateManyInput: Prisma.OrganizationCreateManyInput[] =
    getOrganizationCreateInput(state, creatorId);

  const collectionCreateManyInput: Prisma.CollectionCreateManyInput[] =
    getCollectionCreateInput(state, creatorId);

  const mMSourceInput: Prisma.MMSourceCreateInput =
    getMMSourceAndRelatedEntitiesDBInputFromState(state, creatorId);

  // Send log email
  await fetchAPI(
    "/sendEmail",
    {
      serverSide: true,
      body: {
        type: "FeedForm submit",
        state,
        personCreateManyInput,
        organizationCreateManyInput,
        collectionCreateManyInput,
        mMSourceInput,
        author: decodedToken?.email,
      },
    },
    getAccessTokenFromReq(request),
  )
    .then((result) => {
      if (result.error) {
        console.error(`[api/feedForm] sendEmail ERROR :`, result.error);
      } else {
        console.log(`[api/feedForm] sendEmail result :`, result);
      }
    })
    .catch((err) =>
      console.error(
        `[api/feedForm] sendEmail ERROR :`,
        err.status,
        err.message,
      ),
    );

  // Transaction debug object
  const txDebug: any = {};

  // Execute all operations in a single transaction
  return await db
    .$transaction(
      async (tx) => {
        txDebug.persons = await tx.person.createMany({
          data: personCreateManyInput,
        });

        txDebug.organizations = await tx.organization.createMany({
          data: organizationCreateManyInput,
        });

        txDebug.collections = await tx.collection.createMany({
          data: collectionCreateManyInput,
        });

        // Compute sectionCount for this MM Source purely from the submitted state
        const includedPieceVersionIds = state.mMSourceOnPieceVersions.map(
          (pv) => pv.pieceVersionId,
        );
        const includedPieceVersions = state.pieceVersions.filter((pv) =>
          includedPieceVersionIds.includes(pv.id),
        );
        const sectionCount = includedPieceVersions.reduce(
          (acc, pv) =>
            acc +
            pv.movements.reduce((mAcc, mv) => mAcc + mv.sections.length, 0),
          0,
        );

        const mMSource = await tx.mMSource.create({
          data: { ...mMSourceInput, sectionCount },
        });

        txDebug.mMSource = mMSource;
        const mMSourceId = mMSource.id;
        txDebug.mMSourceId = mMSourceId;

        const metronomeMarksInput: Prisma.MetronomeMarkCreateManyInput[] =
          state.metronomeMarks
            .filter((metronomeMark) => !metronomeMark.noMM)
            .map((metronomeMark) =>
              getMetronomeMarkDBInputFromState(metronomeMark, mMSourceId),
            );

        txDebug.metronomeMarksInput = metronomeMarksInput;

        const metronomeMarks = await tx.metronomeMark.createMany({
          data: metronomeMarksInput,
        });

        txDebug.metronomeMarks = metronomeMarks;

        return { mMSourceInput, mMSource, metronomeMarks };
      },
      {
        maxWait: 5000,
        timeout: 60000,
      },
    )
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

      console.log(`[feedForm API route] ---------- END / Success ----------`);
      return NextResponse.json({
        ...results,
        mMSourceFromDb: mMSourceFromDBWithMMs,
      });
    })
    .catch((error) => {
      console.log(`[api/feedForm] ERROR txDebug`, JSON.stringify(txDebug));
      console.log(`[feedForm API route] ---------- END / Error ----------`);
      return NextResponse.json(
        {
          error: `Error during DB persistence: ${error.message}`,
          personCreateManyInput,
          organizationCreateManyInput,
          collectionCreateManyInput,
          mMSourceInput,
          txDebug,
        },
        { status: 500 },
      );
    });
}
