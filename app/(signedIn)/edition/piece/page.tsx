import { db } from "@/utils/db";
import Link from "next/link";
import { EDITION_COMPOSER_URL } from "@/utils/routes";
import PieceSelectForm from "@/components/PieceSelectForm";

async function getData(composerId: string) {
  // Fetch all composers as person with et least 1 composition
  const pieces = await db.piece.findMany({
    where: {
      composerId,
    },
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      title: true,
      nickName: true,
      yearOfComposition: true,
    },
  });
  return { pieces };
}

export default async function Piece({ searchParams: { composerId } }) {
  console.log(`[Piece] composerId :`, composerId);
  if (!composerId) {
    return (
      <div>
        <h1 className="mb-4 text-4xl font-bold">Select a composer first</h1>
        <Link href={EDITION_COMPOSER_URL} className="btn">
          Back
        </Link>
      </div>
    );
  }
  const { pieces } = await getData(composerId);
  console.log(
    `[Contribute] pieces (${pieces.length}) :`,
    JSON.stringify(pieces),
  );

  return (
    <div
    // className="flex flex-col items-center justify-center"
    >
      <h1 className="mb-4 text-4xl font-bold">Select a composer</h1>
      <PieceSelectForm pieces={pieces} />
    </div>
  );
}
