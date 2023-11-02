import { db } from "@/utils/db";
import PieceVersionSelectForm from "@/components/PieceVersionSelectForm";

async function getData(pieceId: string) {
  if (!pieceId) return { pieceVersions: [] };
  // Fetch all composers as person with et least 1 composition
  const pieceVersions = await db.pieceVersion.findMany({
    where: {
      pieceId,
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
  return { pieceVersions };
}

export default async function Piece({ searchParams: { pieceId } }) {
  const { pieceVersions } = await getData(pieceId);

  return (
    <div
    // className="flex flex-col items-center justify-center"
    >
      <h1 className="mb-4 text-4xl font-bold">Select a piece version</h1>
      <PieceVersionSelectForm pieceVersions={pieceVersions} />
    </div>
  );
}
