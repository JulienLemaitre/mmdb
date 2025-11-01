import React from "react";
import { RequiredChecklistItem } from "@/features/review/ReviewChecklistSchema";

type Props = {
  item: RequiredChecklistItem;
  checked: boolean;
  changed: boolean;
  onToggle: () => void;
  onEdit: () => void;
};

export function ChecklistItemRow({
  item,
  checked,
  changed,
  onToggle,
  onEdit,
}: Props) {
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
      <td>{item.value || "-"}</td>
      <td>
        <button className="btn btn-xs btn-ghost" onClick={onEdit}>
          Edit
        </button>
      </td>
    </tr>
  );
}
