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
      className={
        changed
          ? "bg-warning/20 cursor-pointer hover:bg-warning/30"
          : "cursor-pointer hover:bg-base-200"
      }
      onClick={onToggle}
    >
      <td>
        <input
          type="checkbox"
          className="checkbox checkbox-primary"
          checked={checked}
          onClick={(event) => event.stopPropagation()}
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
        <button
          className="btn btn-md btn-ghost"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
        >
          Edit
        </button>
      </td>
    </tr>
  );
}
