import { Prisma } from "@prisma/client";
import { PersistableFeedFormState } from "@/types/feedFormTypes";

// Prepare the data for persistence in DB of new Persons
export default function getPersonCreateInput(
  state: PersistableFeedFormState,
  creatorId: string,
): Prisma.PersonCreateManyInput[] {
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
    const contribution = state.mMSourceContributions.find(
      // @ts-ignore
      (c) => c?.person?.id === person.id,
    );
    if (!(piece || contribution)) {
      console.log(
        `[getComposerCreateInput] No piece or contribution pointing to the new person ${person.id}`,
      );
      return false;
    }

    if (contribution) {
      return true;
    }

    if (piece) {
      const pieceVersionList = state.pieceVersions.filter(
        // @ts-ignore
        (pv) => pv.pieceId === piece.id,
      );
      if (!pieceVersionList || pieceVersionList.length === 0) {
        console.log(
          // @ts-ignore
          `[getComposerCreateInput] No pieceVersion for the piece ${piece.id} pointing to the new composer ${person.id}`,
        );
        return false;
      }

      return state.mMSourcePieceVersions.some((mms) =>
        pieceVersionList.some((pv) => pv.id === mms.pieceVersionId),
      );
    }
  });
  console.log(
    `[getComposerCreateInput] newPersons`,
    JSON.stringify(newPersons, null, 2),
  );

  const personsInput: Prisma.PersonCreateManyInput[] = newPersons.map(
    (newPerson) => ({
      id: newPerson.id,
      firstName: newPerson.firstName,
      lastName: newPerson.lastName,
      birthYear: newPerson.birthYear,
      deathYear: newPerson.deathYear,
      creatorId,
    }),
  );

  return personsInput;
}
