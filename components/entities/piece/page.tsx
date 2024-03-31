import { db } from "@/utils/db";
import PieceSelectForm from "@/components/entities/piece/PieceSelectForm";

async function getData(composerId: string) {
  if (!composerId) return { pieces: [] };
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
      nickname: true,
      yearOfComposition: true,
    },
  });
  return { pieces };
}

export default async function Piece({ searchParams: { composerId } }) {
  const { pieces } = await getData(composerId);

  return (
    <div className="w-full max-w-md">
      <h1 className="mb-4 text-4xl font-bold">Select a piece</h1>
      <p className="italic">
        {`Search by typing the name.
          If it is not listed yet, you will be able to create it.`}
      </p>
      <PieceSelectForm pieces={pieces} />
    </div>
  );
}
