import { db } from "@/utils/db";
import Link from "next/link";
import { EDITION_PIECE_URL } from "@/utils/routes";
import PieceVersionSelectForm from "@/components/PieceVersionSelectForm";

async function getData(pieceId: string) {
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
              tempoIndication: true,
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
  console.log(`[Piece] pieceId :`, pieceId);
  if (!pieceId) {
    return (
      <div>
        <h1 className="mb-4 text-4xl font-bold">Select a piece first</h1>
        <Link href={EDITION_PIECE_URL} className="btn">
          Back
        </Link>
      </div>
    );
  }
  const { pieceVersions } = await getData(pieceId);
  console.log(
    `[Contribute] pieceVersions (${pieceVersions.length}) :`,
    JSON.stringify(pieceVersions),
  );

  return (
    <div
    // className="flex flex-col items-center justify-center"
    >
      <h1 className="mb-4 text-4xl font-bold">Select a piece version</h1>
      <PieceVersionSelectForm pieceVersions={pieceVersions} />
    </div>
  );
}
