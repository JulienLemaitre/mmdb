import React from "react";
import {
  ChecklistGraph,
  RequiredChecklistItem,
} from "@/features/review/ReviewChecklistSchema";
import { getItemValue } from "@/features/review/utils/getItemValue";

type Props = {
  graph: ChecklistGraph;
  item: RequiredChecklistItem;
  checked: boolean;
  changed: boolean;
  onToggle: () => void;
  onEdit: () => void;
};

export function ChecklistItemRow({
  item,
  graph,
  checked,
  changed,
  onToggle,
  onEdit,
}: Props) {
  const value = getItemValue({ item, graph });
  console.log(`[ChecklistItemRow] typeof value`, typeof value, value);

  return (
    <tr
      data-fieldpath={item.fieldPath}
      className={changed ? "bg-warning/20" : ""}
    >
      <td>
        <input
          type="checkbox"
          className="checkbox checkbox-primary"
          checked={checked}
          onChange={onToggle}
        />
      </td>
      <td>{item.label}</td>
      <td>{value || "-"}</td>
      <td>
        <button className="btn btn-xs btn-ghost" onClick={onEdit}>
          Edit
        </button>
      </td>
    </tr>
  );
}
