import { Prisma } from "@prisma/client";
import { PersistableFeedFormState } from "@/types/feedFormTypes";

// Prepare the data for persistence in DB of new Collections
export default function getCollectionCreateInput(
  state: PersistableFeedFormState,
  creatorId: string,
): Prisma.CollectionCreateManyInput[] {
  // Find all the collections with a property isNew = true in the state.collections array, which id is referred to by a collectionId property of an object in state.pieces array, of which id is referred to by a pieceId property of an object in state.pieceVersions array, which id is referred to by a pieceVersionId property of an object in state.mMSourcePieceVersions array.
  const newCollections = state.collections.filter((collection) => {
    if (!collection.isNew) {
      console.log(
        `[getCollectionCreateInput] Collection found without isNew = true`,
      );
      return false;
    }

    const piece = state.pieces.find((p) => p.collectionId === collection.id);
    if (!piece) {
      console.log(
        `[getCollectionCreateInput] No piece pointing to the new collection ${collection.id}`,
      );
      return false;
    }

    const pieceVersion = state.pieceVersions.find(
      (pv) => pv.pieceId === piece.id,
    );
    if (!pieceVersion) {
      console.log(
        `[getCollectionCreateInput] No pieceVersion for the piece ${piece.id} pointing to the new collection ${collection.id}`,
      );
      return false;
    }

    return state.mMSourcePieceVersions.some(
      (mms) => mms.pieceVersionId === pieceVersion.id,
    );
  });
  console.log(
    `[getCollectionCreateInput] newCollections`,
    JSON.stringify(newCollections, null, 2),
  );

  const collectionsInput: Prisma.CollectionCreateManyInput[] =
    newCollections.map((collection) => ({
      id: collection.id,
      title: collection.title,
      composerId: collection.composerId,
      creatorId: creatorId,
    }));

  return collectionsInput;
}
