import { ReviewView } from "@/app/(signedIn)/review/[reviewId]/checklist/page";
import { ChecklistItemRow } from "../components/ChecklistItemRow";
import { ChecklistGraph, RequiredChecklistItem } from "@/types/reviewTypes";

type Props = {
  graph: ChecklistGraph;
  pieceId: string;
  items: RequiredChecklistItem[];
  checkedKeys: Set<string>;
  changedKeys: Set<string>;
  onToggle: (item: RequiredChecklistItem) => void;
  onToggleAll: (items: RequiredChecklistItem[]) => void;
  onEdit: (item: RequiredChecklistItem) => void;
  onNavigate: (view: ReviewView) => void;
};

export function PieceSlice({
  graph,
  pieceId,
  items,
  onNavigate,
  onToggleAll,
  ...rest
}: Props) {
  const piece = graph.pieces?.find((p) => p.id === pieceId);
  const pieceVersion = graph.pieceVersions?.find(
    (pv) => pv.pieceId === pieceId,
  );
  if (!piece || !pieceVersion) return <div>Piece not found.</div>;

  const pieceItems = items.filter(
    (it) =>
      it.lineage.pieceId === pieceId &&
      (it.entityType === "PIECE" || it.entityType === "PIECE_VERSION"),
  );

  return (
    <div>
      <button
        className="btn btn-sm btn-ghost mb-4"
        onClick={() => onNavigate({ view: "SUMMARY" })}
      >
        &larr; Back to Summary
      </button>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Piece: {piece.title}</h2>
        <button
          className="btn btn-sm btn-outline"
          onClick={() => onToggleAll(pieceItems)}
        >
          Check all
        </button>
      </div>

      {/* Piece and Piece Version items */}
      <table className="table table-md mb-6">
        <tbody>
          {pieceItems.map((item) => (
            <ChecklistItemRow
              key={item.fieldPath}
              item={item}
              onToggle={() => rest.onToggle(item)}
              onEdit={() => rest.onEdit(item)}
              checked={rest.checkedKeys.has(item.fieldPath)}
              changed={rest.changedKeys.has(item.fieldPath)}
            />
          ))}
        </tbody>
      </table>

      {/* Movements and Sections */}
      {(pieceVersion as any).movements?.map((mov: any) => {
        const movementItems = items.filter(
          (it) =>
            it.lineage.movementId === mov.id && it.entityType === "MOVEMENT",
        );
        return (
          <div key={mov.id} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">Movement {mov.rank}</h3>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => onToggleAll(movementItems)}
              >
                Check all
              </button>
            </div>
            <table className="table table-md mb-4">
              <tbody>
                {movementItems.map((item) => (
                  <ChecklistItemRow
                    key={item.fieldPath}
                    item={item}
                    onToggle={() => rest.onToggle(item)}
                    onEdit={() => rest.onEdit(item)}
                    checked={rest.checkedKeys.has(item.fieldPath)}
                    changed={rest.changedKeys.has(item.fieldPath)}
                  />
                ))}
              </tbody>
            </table>

            {mov.sections?.map((sec: any) => {
              const sectionItems = items.filter(
                (it) => it.entityId === sec.id && it.entityType === "SECTION",
              );
              const metronomeMarkItems = items.filter(
                (it) =>
                  it.entityType === "METRONOME_MARK" &&
                  graph.metronomeMarks?.find((mm) => mm.id === it.entityId)
                    ?.sectionId === sec.id,
              );
              const allSectionItems = [...sectionItems, ...metronomeMarkItems];
              return (
                <div key={sec.id} className="pl-4 border-l-2 ml-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Section {sec.rank}</h4>
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={() => onToggleAll(allSectionItems)}
                    >
                      Check all
                    </button>
                  </div>
                  <table className="table table-md">
                    <tbody>
                      {/* Section Items */}
                      {sectionItems.map((item) => (
                        <ChecklistItemRow
                          key={item.fieldPath}
                          item={item}
                          onToggle={() => rest.onToggle(item)}
                          onEdit={() => rest.onEdit(item)}
                          checked={rest.checkedKeys.has(item.fieldPath)}
                          changed={rest.changedKeys.has(item.fieldPath)}
                        />
                      ))}

                      {/* Metronome Mark Items for this Section */}
                      {metronomeMarkItems.map((item) => (
                        <ChecklistItemRow
                          key={item.fieldPath}
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
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
