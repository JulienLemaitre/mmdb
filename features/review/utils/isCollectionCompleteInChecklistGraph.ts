import { getEntityByIdOrKey } from "@/utils/getEntityByIdOrKey";
import { debug } from "@/utils/debugLogger";
import { ChecklistGraph } from "@/types/reviewTypes";

export function isCollectionCompleteInChecklistGraph({
  collectionId,
  graph,
}: {
  collectionId: string;
  graph: ChecklistGraph;
}): boolean {
  if (!collectionId) return false;
  const pieceCollection = getEntityByIdOrKey(
    graph,
    "collections",
    collectionId,
  );
  if (!pieceCollection) return false;
  const collectionPieceCount = pieceCollection.pieceCount;
  const sourceCollectionPieceCount = graph.pieces.filter(
    (p) => p.collectionId === collectionId,
  );
  const isCollectionFullyIncluded =
    sourceCollectionPieceCount.length === collectionPieceCount;
  debug.info(
    `isCollectionCompleteInChecklistGraph: collectionId=${collectionId}, isCollectionFullyIncluded=${isCollectionFullyIncluded}`,
  );
  return isCollectionFullyIncluded;
}
