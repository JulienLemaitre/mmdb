// Utility function to gather the data into groups with all related information from graph
import { MMSourceOnPieceVersionsState } from "@/types/formTypes";
import { getEntityByIdOrKey } from "@/utils/getEntityByIdOrKey";
import { ChecklistGraph } from "@/features/review/ReviewChecklistSchema";
import { isCollectionCompleteInChecklistGraph } from "@/features/review/utils/isCollectionCompleteInChecklistGraph";

export function processSourceOnPieceVersionsForDisplay(graph: ChecklistGraph) {
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
  const sourceOnPieceVersions = graph.sourceOnPieceVersions;

  sourceOnPieceVersions.forEach((sourceOnPieceVersion) => {
    const pieceVersion = getEntityByIdOrKey(
      graph,
      "pieceVersions",
      sourceOnPieceVersion.pieceVersionId,
    );
    const piece = getEntityByIdOrKey(graph, "pieces", pieceVersion.pieceId);

    // Set collection only if the mMSource contains all the pieces of this collection
    let includeCollection =
      !piece.collectionId &&
      isCollectionCompleteInChecklistGraph({
        collectionId: piece.collectionId,
        graph,
      });
    const collection =
      includeCollection &&
      getEntityByIdOrKey(graph, "collections", piece.collectionId);
    const composer = getEntityByIdOrKey(graph, "persons", piece.composerId);

    const item = {
      mMSourceOnPieceVersion: sourceOnPieceVersion,
      pieceVersion,
      piece,
      composer,
      ...(collection ? { collection } : {}),
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
