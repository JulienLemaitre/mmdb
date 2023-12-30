import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { db } from "@/utils/db";
import PieceEditForm from "@/app/(signedIn)/edition/piece/PieceEditForm";

async function getData(pieceId: string) {
  if (!pieceId) {
    console.log(`[PieceUpdate] pieceId is undefined`);
    return { piece: null };
  }
  // Fetch the previously selected piece
  const piece = await db.piece.findUnique({
    where: {
      id: pieceId,
    },
    select: {
      id: true,
      title: true,
      nickname: true,
      yearOfComposition: true,
    },
  });
  console.log(`[PieceUpdate] FETCHED piece :`, piece);
  return { piece: piece ? deleteNullPropertiesFromObject(piece) : null };
}

export default async function PieceUpdate({ searchParams: { pieceId } }) {
  const { piece } = await getData(pieceId);
  console.log(`[PieceUpdate] piece :`, JSON.stringify(piece));

  if (!piece) {
    return (
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-4xl font-bold">Piece update error</h1>
        <p className="mb-4 text-lg">
          The piece you are trying to update was not found.
        </p>
      </div>
    );
  }

  return <PieceEditForm piece={piece} />;
}
