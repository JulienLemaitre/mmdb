import {
  ChecklistGraph,
  RequiredChecklistItem,
} from "@/features/review/ReviewChecklistSchema";
import { ReviewView } from "@/app/(signedIn)/review/[reviewId]/checklist/page";
import { ChecklistItemRow } from "../components/ChecklistItemRow";
import { processSourceOnPieceVersionsForDisplay } from "@/features/review/utils/ProcessSourceOnPieceVersionsForDisplay";

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
  const sourceOnPieceVersionGroups =
    processSourceOnPieceVersionsForDisplay(graph);
  // Filter for items to display in this slice
  const sourceItems = items.filter((it) => it.entityType === "MM_SOURCE");
  const sourceOnPieceVersions = items.filter(
    (it) => it.entityType === "MM_SOURCE_ON_PIECE_VERSION",
  );
  const referenceItems = items.filter((it) => it.entityType === "REFERENCE");
  const contributionItems = items.filter(
    (it) => it.entityType === "CONTRIBUTION",
  );
  const personItems = items.filter((it) => it.entityType === "PERSON");
  const orgItems = items.filter((it) => it.entityType === "ORGANIZATION");

  // TODO is lacking the review of persons and orgs that need to be reviewed

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
              checked={checkedKeys.has(item.fieldPath)}
              changed={changedKeys.has(item.fieldPath)}
              onToggle={() => onToggle(item)}
              onEdit={() => onEdit(item)}
            />
          ))}
          {/* Add other groups like contributions, persons, etc. */}
        </tbody>
      </table>

      {referenceItems.length > 0 && (
        <>
          <h2 className="text-xl font-bold mt-6 mb-4">References</h2>
          <table className="table table-sm">
            <tbody>
              {referenceItems.map((item) => (
                <ChecklistItemRow
                  key={item.fieldPath}
                  item={item}
                  checked={checkedKeys.has(item.fieldPath)}
                  changed={changedKeys.has(item.fieldPath)}
                  onToggle={() => onToggle(item)}
                  onEdit={() => onEdit(item)}
                />
              ))}
              {/* Add other groups like contributions, persons, etc. */}
            </tbody>
          </table>
        </>
      )}

      <h2 className="text-xl font-bold mt-6 mb-4">Contributions</h2>
      {/* Checklist Table */}
      <table className="table table-sm">
        <tbody>
          {contributionItems.map((item) => (
            <ChecklistItemRow
              key={item.fieldPath}
              item={item}
              checked={checkedKeys.has(item.fieldPath)}
              changed={changedKeys.has(item.fieldPath)}
              onToggle={() => onToggle(item)}
              onEdit={() => onEdit(item)}
            />
          ))}
          {/* Add other groups like contributions, persons, etc. */}
        </tbody>
      </table>

      <h2 className="text-xl font-bold mt-6 mb-4">Order of pieces</h2>
      {/* Checklist Table */}
      <table className="table table-sm">
        <tbody>
          {sourceOnPieceVersions.map((item) => (
            <ChecklistItemRow
              key={item.fieldPath}
              item={item}
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
          {sourceOnPieceVersionGroups.map((group, groupindex) => {
            if (group.type === "collection") {
              const composer = graph.persons?.find(
                (p) => p.id === group.collection.composerId,
              );
              // console.group(`COLLECTION`);
              // console.log(`[collection] group :`, group);
              // console.log(`[collection] composer :`, composer);
              // console.log(`[collection] group.items :`, group.items);
              // console.groupEnd();
              return (
                <button
                  key={group.collection.id}
                  className="btn btn-outline btn-primary justify-start"
                  onClick={() =>
                    onNavigate({
                      view: "COLLECTION",
                      collectionId: group.collection.id,
                    })
                  }
                >
                  Collection: {group.collection.title}
                </button>
              );
            } else {
              // Single piece (not part of a full collection)
              const item = group.items[0];

              return (
                <button
                  key={item.piece.id}
                  className="btn btn-outline btn-secondary justify-start"
                  onClick={() =>
                    onNavigate({ view: "PIECE", pieceId: item.piece.id })
                  }
                >
                  Piece: {item.piece.title}
                </button>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
