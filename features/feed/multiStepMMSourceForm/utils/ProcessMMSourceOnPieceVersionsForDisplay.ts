// Utility function to gather the data into groups with all related information from feedFormState
import { MMSourceOnPieceVersionsState } from "@/types/formTypes";
import { getEntityByIdOrKey } from "@/context/feedFormContext";

export function processMMSourceOnPieceVersionsForDisplay(
  mMSourceOnPieceVersions: MMSourceOnPieceVersionsState[],
  feedFormState: any,
) {
  const processedGroups: Array<{
    type: "collection" | "single";
    collection?: any;
    items: Array<{
      mMSourceOnPieceVersion: MMSourceOnPieceVersionsState;
      pieceVersion: any;
      piece: any;
      composer: any;
      collection?: any;
    }>;
  }> = [];

  let currentGroup: (typeof processedGroups)[0] | null = null;

  mMSourceOnPieceVersions.forEach((mMSourceOnPieceVersion) => {
    const pieceVersion = getEntityByIdOrKey(
      feedFormState,
      "pieceVersions",
      mMSourceOnPieceVersion.pieceVersionId,
    );
    const piece = getEntityByIdOrKey(
      feedFormState,
      "pieces",
      pieceVersion.pieceId,
    );
    const collection = getEntityByIdOrKey(
      feedFormState,
      "collections",
      piece.collectionId,
    );
    const composer = getEntityByIdOrKey(
      feedFormState,
      "persons",
      piece.composerId,
    );

    const item = {
      mMSourceOnPieceVersion,
      pieceVersion,
      piece,
      composer,
      collection,
    };

    // If this piece has a collection
    if (collection) {
      // If we don't have a current group or the current group is for a different collection
      if (
        !currentGroup ||
        currentGroup.type !== "collection" ||
        currentGroup.collection?.id !== collection.id
      ) {
        // Start a new collection group
        currentGroup = {
          type: "collection",
          collection,
          items: [item],
        };
        processedGroups.push(currentGroup);
      } else {
        // Add to the existing collection group
        currentGroup.items.push(item);
      }
    } else {
      // This is a single piece (no collection)
      currentGroup = {
        type: "single",
        items: [item],
      };
      processedGroups.push(currentGroup);
      currentGroup = null; // Reset since single pieces don't continue grouping
    }
  });

  return processedGroups;
}
