export const dynamic = "force-dynamic";
export const revalidate = 0;

import { db } from "@/utils/db";
import PieceVersionEditForm from "@/app/(signedIn)/edition/piece-version/PieceVersionEditForm";

async function getData(pieceVersionId: string) {
  if (!pieceVersionId) {
    console.log(`[PieceVersionUpdate] pieceVersionId is undefined`);
    return { pieceVersion: null };
  }
  // Fetch the previously selected pieceVersion
  const pieceVersion = await db.pieceVersion.findUnique({
    where: {
      id: pieceVersionId,
    },
    select: {
      id: true,
      category: true,
      movements: {
        select: {
          id: true,
          rank: true,
          key: true,
          sections: {
            select: {
              id: true,
              rank: true,
              metreNumerator: true,
              metreDenominator: true,
              isCommonTime: true,
              isCutTime: true,
              tempoIndication: {
                select: {
                  text: true,
                },
              },
              comment: true,
              fastestStaccatoNotesPerBar: true,
              fastestStructuralNotesPerBar: true,
              fastestRepeatedNotesPerBar: true,
              fastestOrnamentalNotesPerBar: true,
            },
            orderBy: {
              rank: "asc",
            },
          },
        },
        orderBy: {
          rank: "asc",
        },
      },
    },
  });
  return { pieceVersion };
}

export default async function PieceVersionUpdate({
  searchParams: { pieceVersionId },
}) {
  const { pieceVersion } = await getData(pieceVersionId);
  console.log(
    `[PieceVersionUpdate] pieceVersion :`,
    JSON.stringify(pieceVersion),
  );

  if (!pieceVersion) {
    return (
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-4xl font-bold">Piece version update error</h1>
        <p className="mb-4 text-lg">
          The piece version you are trying to update was not found.
        </p>
      </div>
    );
  }

  const pieceVersionInput = {
    ...pieceVersion,
    category: {
      value: pieceVersion.category,
      label: pieceVersion.category,
    },
    movements: pieceVersion.movements.map((mvt) => ({
      ...mvt,
      key: {
        value: mvt.key,
        label: mvt.key,
      },
      sections: mvt.sections.map((section) => ({
        ...section,
        tempoIndication: section?.tempoIndication?.text,
      })),
    })),
  };

  return <PieceVersionEditForm pieceVersion={pieceVersionInput} />;
}
