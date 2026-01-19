import React from "react";

import { RequiredChecklistItem } from "@/types/reviewTypes";

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
      <td>
        {typeof item.value === "boolean"
          ? item.value.toString()
          : (item.value ?? "-")}
      </td>
      <td className="py-0">
        <button className="btn btn-md btn-ghost" onClick={onEdit}>
          Edit
        </button>
      </td>
    </tr>
  );
}
