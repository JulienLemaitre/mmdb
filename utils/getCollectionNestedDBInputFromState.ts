import { Prisma } from "@prisma/client";
import { PersistableFeedFormState } from "@/types/feedFormTypes";

export default function getCollectionNestedDBInputFromState(
  collectionId: string,
  state: PersistableFeedFormState,
  creatorId: string,
): Prisma.CollectionCreateNestedOneWithoutPiecesInput {
  const newCollection = state.collections.find(
    (collection) => collection.id === collectionId && collection.isNew,
  );

  if (!newCollection) {
    return {
      connect: {
        id: collectionId,
      },
    };
  }

  return {
    create: {
      id: newCollection.id,
      title: newCollection.title,
      // New composer are persisted before this query, so we just connect to it be it new or not
      composer: {
        connect: {
          id: newCollection.composerId,
        },
      },
      creator: {
        connect: {
          id: creatorId,
        },
      },
    },
  };
}
