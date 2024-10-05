// Prepare the data for persistence in DB of new Collections
import { PersistableFeedFormState } from "@/components/context/feedFormContext";
import { Prisma } from "@prisma/client";

export default function getComposerCreateInput(
  state: PersistableFeedFormState,
  creatorId: string,
): Prisma.PersonCreateInput[] {
  // Find all the new composer to persist in db.
  // We don't check explicitly for collection because the composer of a collection will be the composer of its pieces by definition and by design.
  const newPersons = state.persons.filter((person) => {
    if (!person.isNew) {
      console.log(
        `[getComposerCreateInput] person found without isNew = true : ${person.id}`,
      );
      return false;
    }

    const piece = state.pieces.find((p) => p.composerId === person.id);
    if (!piece) {
      console.log(
        `[getComposerCreateInput] No piece pointing to the new person ${person.id}`,
      );
      return false;
    }

    const pieceVersion = state.pieceVersions.find(
      (pv) => pv.pieceId === piece.id,
    );
    if (!pieceVersion) {
      console.log(
        `[getComposerCreateInput] No pieceVersion for the piece ${piece.id} pointing to the new composer ${person.id}`,
      );
      return false;
    }

    return state.mMSourcePieceVersions.some(
      (mms) => mms.pieceVersionId === pieceVersion.id,
    );
  });
  console.log(
    `[getComposerCreateInput] newPersons`,
    JSON.stringify(newPersons, null, 2),
  );

  const personsInput: Prisma.PersonCreateInput[] = newPersons.map(
    (newPerson) => ({
      id: newPerson.id,
      firstName: newPerson.firstName,
      lastName: newPerson.lastName,
      birthYear: newPerson.birthYear,
      creator: {
        connect: {
          id: creatorId,
        },
      },
    }),
  );

  return personsInput;
}
