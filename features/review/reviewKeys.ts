import type { ChecklistEntityType } from "@/features/review/ReviewChecklistSchema";

export type ChecklistEncodable = {
  entityType: ChecklistEntityType;
  entityId?: string | null;
  fieldPath: string;
};

/**
 * Stable encoding for checklist keys used across UI, progress, and diff helpers
 * Matches utils/reviewDiff.toEncodedKeys convention.
 */
export function encodeChecklistKey(it: ChecklistEncodable): string {
  return `${it.entityType}:${it.entityId ?? ""}:${it.fieldPath}`;
}

export type CheckedKeySet = ReadonlySet<string> | Set<string>;
