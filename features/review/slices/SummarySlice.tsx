import {
  ChecklistGraph,
  RequiredChecklistItem,
} from "@/utils/ReviewChecklistSchema";
import { ReviewView } from "@/app/(signedIn)/review/[reviewId]/checklist/page";
import { ChecklistItemRow } from "../components/ChecklistItemRow";

type Props = {
  graph: ChecklistGraph;
  items: RequiredChecklistItem[];
  checkedKeys: Set<string>;
  changedKeys: Set<string>;
  onToggle: (item: RequiredChecklistItem) => void;
  onEdit: (item: RequiredChecklistItem) => void;
  onNavigate: (view: ReviewView) => void;
};

export function SummarySlice({
  graph,
  items,
  checkedKeys,
  changedKeys,
  onToggle,
  onEdit,
  onNavigate,
}: Props) {
  console.log(`[] graph :`, graph);
  // Filter for items to display in this slice
  const sourceItems = items.filter(
    (it) => it.entityType === "MM_SOURCE" || it.entityType === "REFERENCE",
  );
  const contributionItems = items.filter(
    (it) => it.entityType === "CONTRIBUTION",
  );
  const personItems = items.filter((it) => it.entityType === "PERSON");
  const orgItems = items.filter((it) => it.entityType === "ORGANIZATION");

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Summary & Source Details</h2>
      {/* Checklist Table */}
      <table className="table table-sm">
        <tbody>
          {sourceItems.map((item) => (
            <ChecklistItemRow
              key={item.fieldPath}
              item={item}
              graph={graph}
              checked={checkedKeys.has(item.fieldPath)}
              changed={changedKeys.has(item.fieldPath)}
              onToggle={() => onToggle(item)}
              onEdit={() => onEdit(item)}
            />
          ))}
          {/* Add other groups like contributions, persons, etc. */}
        </tbody>
      </table>

      {/* Navigation Section */}
      <div className="mt-8">
        <h3 className="font-semibold mb-2">Navigate to:</h3>
        <div className="flex flex-col gap-2">
          {graph.collections?.map((coll) => {
            console.log(`[] coll :`, coll);
            return (
              <button
                key={coll.id}
                className="btn btn-outline justify-start"
                onClick={() =>
                  onNavigate({ view: "COLLECTION", collectionId: coll.id })
                }
              >
                Collection: {coll.title}
              </button>
            );
          })}
          {graph.pieces
            ?.filter((p) => !p.collectionId) // Show only pieces not in a collection
            .map((piece) => (
              <button
                key={piece.id}
                className="btn btn-outline btn-secondary justify-start"
                onClick={() => onNavigate({ view: "PIECE", pieceId: piece.id })}
              >
                Piece: {piece.title}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
