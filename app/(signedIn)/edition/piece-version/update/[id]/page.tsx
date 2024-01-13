import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";
import { db } from "@/utils/db";
import PieceVersionEditForm from "@/app/(signedIn)/edition/piece-version/PieceVersionEditForm";

// export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getData(pieceVersionId: string) {
  if (!pieceVersionId) {
    console.log(`[PieceVersionUpdate] pieceVersionId is undefined`);
    return { pieceVersion: null };
  }
  console.log(`[ENTER getData] pieceVersionId:`, pieceVersionId);

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
                  id: true,
                  text: true,
                },
              },
              comment: true,
              fastestStaccatoNotesPerBar: true,
              fastestStructuralNotesPerBar: true,
              fastestRepeatedNotesPerBar: true,
              fastestOrnamentalNotesPerBar: true,
              isFastestStructuralNoteBelCanto: true,
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
  return {
    pieceVersion: pieceVersion
      ? deleteNullPropertiesFromObject(pieceVersion) // We ensure values will not be initiated with null values
      : null,
  };
}

export default async function PieceVersionUpdate({
  params: { id: pieceVersionId },
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
        tempoIndication: {
          label: section.tempoIndication!.text,
          value: section.tempoIndication!.id,
        },
      })),
    })),
  };

  return <PieceVersionEditForm pieceVersion={pieceVersionInput} />;
}
