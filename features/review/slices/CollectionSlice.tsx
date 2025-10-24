import {
  ChecklistGraph,
  RequiredChecklistItem,
} from "@/utils/ReviewChecklistSchema";
import { ReviewView } from "@/app/(signedIn)/review/[reviewId]/checklist/page";
import { ChecklistItemRow } from "../components/ChecklistItemRow";

type Props = {
  graph: ChecklistGraph;
  collectionId: string;
  items: RequiredChecklistItem[];
  checkedKeys: Set<string>;
  changedKeys: Set<string>;
  onToggle: (item: RequiredChecklistItem) => void;
  onEdit: (item: RequiredChecklistItem) => void;
  onNavigate: (view: ReviewView) => void;
};

export function CollectionSlice({
  graph,
  collectionId,
  items,
  onNavigate,
  ...rest
}: Props) {
  const collection = graph.collections?.find((c) => c.id === collectionId);
  if (!collection) {
    return <div>Collection not found.</div>;
  }

  // Items specific to the collection entity itself
  const collectionItems = items.filter(
    (it) => it.entityType === "COLLECTION" && it.entityId === collectionId,
  );
  console.log(`[CollectionSlice] collectionItems :`, collectionItems);

  // Pieces that belong to this collection
  const piecesInCollection = (graph.pieces ?? []).filter(
    (p) => p.collectionId === collectionId,
  );
  console.log(`[CollectionSlice] piecesInCollection :`, piecesInCollection);

  return (
    <div>
      <button
        className="btn btn-sm btn-ghost mb-4"
        onClick={() => onNavigate({ view: "SUMMARY" })}
      >
        &larr; Back to Summary
      </button>
      <h2 className="text-xl font-bold mb-4">Collection: {collection.title}</h2>

      {/* Collection's own checklist items */}
      <table className="table table-sm mb-6">
        <tbody>
          {collectionItems.map((item) => (
            <ChecklistItemRow
              graph={graph}
              key={item.fieldPath}
              item={item}
              checked={rest.checkedKeys.has(item.fieldPath)}
              changed={rest.changedKeys.has(item.fieldPath)}
              onToggle={() => rest.onToggle(item)}
              onEdit={() => rest.onEdit(item)}
            />
          ))}
        </tbody>
      </table>

      {/* Navigation to Pieces within this Collection */}
      <div className="mt-8">
        <h3 className="font-semibold mb-2">Pieces in this collection:</h3>
        <div className="flex flex-col gap-2">
          {piecesInCollection.length > 0 ? (
            piecesInCollection.map((piece) => (
              <button
                key={piece.id}
                className="btn btn-outline justify-start"
                onClick={() => onNavigate({ view: "PIECE", pieceId: piece.id })}
              >
                Piece: {piece.title}
              </button>
            ))
          ) : (
            <p className="text-sm opacity-70">
              No pieces found in this collection for the current review.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
