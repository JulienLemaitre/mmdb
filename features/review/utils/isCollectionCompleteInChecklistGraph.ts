import { ChecklistGraph } from "@/features/review/ReviewChecklistSchema";
import { getEntityByIdOrKey } from "@/utils/getEntityByIdOrKey";
import { debug } from "@/utils/debugLogger";

export function isCollectionCompleteInChecklistGraph({
  collectionId,
  graph,
}: {
  collectionId: string;
  graph: ChecklistGraph;
}) {
  const pieceCollection = getEntityByIdOrKey(
    graph,
    "collections",
    collectionId,
  );
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
