import {
  ChecklistGraph,
  RequiredChecklistItem,
} from "@/features/review/ReviewChecklistSchema";
import { ReviewView } from "@/app/(signedIn)/review/[reviewId]/checklist/page";
import { ChecklistItemRow } from "../components/ChecklistItemRow";

type Props = {
  graph: ChecklistGraph;
  pieceId: string;
  items: RequiredChecklistItem[];
  checkedKeys: Set<string>;
  changedKeys: Set<string>;
  onToggle: (item: RequiredChecklistItem) => void;
  onEdit: (item: RequiredChecklistItem) => void;
  onNavigate: (view: ReviewView) => void;
};

export function PieceSlice({
  graph,
  pieceId,
  items,
  onNavigate,
  ...rest
}: Props) {
  const piece = graph.pieces?.find((p) => p.id === pieceId);
  const pieceVersion = graph.pieceVersions?.find(
    (pv) => pv.pieceId === pieceId,
  );
  if (!piece || !pieceVersion) return <div>Piece not found.</div>;

  const pieceItems = items.filter(
    (it) => it.entityType === "PIECE" || it.entityType === "PIECE_VERSION",
  );
  console.log(`[PieceSlice] pieceItems :`, pieceItems);

  return (
    <div>
      <button
        className="btn btn-sm btn-ghost mb-4"
        onClick={() => onNavigate({ view: "SUMMARY" })}
      >
        &larr; Back to Summary
      </button>
      <h2 className="text-xl font-bold mb-4">Piece: {piece.title}</h2>

      {/* Piece and Piece Version items */}
      <table className="table table-sm mb-6">
        <tbody>
          {pieceItems.map((item) => (
            <ChecklistItemRow
              key={item.fieldPath}
              item={item}
              graph={graph}
              onToggle={() => rest.onToggle(item)}
              onEdit={() => rest.onEdit(item)}
              checked={rest.checkedKeys.has(item.fieldPath)}
              changed={rest.changedKeys.has(item.fieldPath)}
            />
          ))}
        </tbody>
      </table>

      {/* Movements and Sections */}
      {(pieceVersion as any).movements?.map((mov: any) => (
        <div key={mov.id} className="mb-6">
          <h3 className="font-semibold text-lg">Movement {mov.rank}</h3>
          <table className="table table-sm mb-4">
            <tbody>
              {items
                .filter(
                  (it) =>
                    it.lineage.movementId === mov.id &&
                    it.entityType === "MOVEMENT",
                )
                .map((item) => (
                  <ChecklistItemRow
                    key={item.fieldPath}
                    item={item}
                    graph={graph}
                    onToggle={() => rest.onToggle(item)}
                    onEdit={() => rest.onEdit(item)}
                    checked={rest.checkedKeys.has(item.fieldPath)}
                    changed={rest.changedKeys.has(item.fieldPath)}
                  />
                ))}
            </tbody>
          </table>

          {mov.sections?.map((sec: any) => (
            <div key={sec.id} className="pl-4 border-l-2 ml-4 mb-4">
              <h4 className="font-semibold">Section {sec.rank}</h4>
              <table className="table table-sm">
                <tbody>
                  {/* Section Items */}
                  {items
                    .filter(
                      (it) =>
                        it.entityId === sec.id && it.entityType === "SECTION",
                    )
                    .map((item) => (
                      <ChecklistItemRow
                        key={item.fieldPath}
                        graph={graph}
                        item={item}
                        onToggle={() => rest.onToggle(item)}
                        onEdit={() => rest.onEdit(item)}
                        checked={rest.checkedKeys.has(item.fieldPath)}
                        changed={rest.changedKeys.has(item.fieldPath)}
                      />
                    ))}

                  {/* Metronome Mark Items for this Section */}
                  {items
                    .filter(
                      (it) =>
                        it.entityType === "METRONOME_MARK" &&
                        graph.metronomeMarks?.find(
                          (mm) => mm.id === it.entityId,
                        )?.sectionId === sec.id,
                    )
                    .map((item) => (
                      <ChecklistItemRow
                        key={item.fieldPath}
                        graph={graph}
                        item={item}
                        onToggle={() => rest.onToggle(item)}
                        onEdit={() => rest.onEdit(item)}
                        checked={rest.checkedKeys.has(item.fieldPath)}
                        changed={rest.changedKeys.has(item.fieldPath)}
                      />
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
