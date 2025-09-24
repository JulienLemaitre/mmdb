"use client";

import React from "react";
import type { RequiredChecklistItem } from "@/utils/ReviewChecklistSchema";

export function ChecklistRow({
  item,
  checked,
  changed,
  onToggle,
  onEdit,
  entityBadge,
}: {
  item: RequiredChecklistItem;
  checked: boolean;
  changed: boolean;
  onToggle: () => void;
  onEdit: () => void;
  entityBadge?: React.ReactNode;
}) {
  const rowStateLabel = `${item.label} – ${checked ? "checked" : "unchecked"}${changed ? ", changed" : ""}`;

  const rowClass = [
    changed ? "bg-warning/10" : "",
    !checked ? "border-l-4 border-info bg-info/5" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <tr role="row" aria-label={rowStateLabel} className={rowClass}>
      <td>
        <input
          type="checkbox"
          className="checkbox checkbox-primary"
          checked={checked}
          aria-label={`${checked ? "Unmark" : "Mark"} '${item.label}' as checked`}
          onChange={onToggle}
        />
      </td>
      <td>
        {entityBadge ? (
          <>{entityBadge}</>
        ) : (
          <span className="sr-only">{item.entityType}</span>
        )}
      </td>
      <td>
        <span>{item.label}</span>
        {changed && (
          <span
            className="badge badge-warning badge-outline ml-2"
            aria-label="Changed"
          >
            Changed
          </span>
        )}
        {!checked && (
          <span
            className="badge badge-info badge-outline ml-2"
            aria-label="Needs check"
          >
            Needs check
          </span>
        )}
      </td>
      <td className="opacity-70 text-xs">{item.fieldPath}</td>
      <td>
        <button
          type="button"
          className="btn btn-xs btn-ghost hover:btn-accent"
          onClick={onEdit}
          title="Edit this entity"
          aria-label={`Edit '${item.label}'`}
        >
          Edit
        </button>
      </td>
    </tr>
  );
}
