import { NextResponse } from "next/server";
import { expandRequiredChecklistItems } from "@/utils/ReviewChecklistSchema";
import { buildMockOverview } from "@/utils/reviewMock";
import { computeChangedChecklistFieldPaths } from "@/utils/reviewDiff";

// POST /api/review/[reviewId]/submit
// Body: { workingCopy, checklistState: Array<{entityType, entityId, fieldPath, checked}>, overallComment? }
// This mock implementation validates completeness server-side and computes diffs; it does not persist to DB yet.
export async function POST(req: Request, { params }: { params: { reviewId: string } }) {
  const reviewId = params.reviewId;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const workingCopy = body?.workingCopy;
  const checklistState = Array.isArray(body?.checklistState) ? body.checklistState : [];
  const overallComment = body?.overallComment ?? null;

  if (!workingCopy || !Array.isArray(checklistState)) {
    return NextResponse.json({ error: "Missing workingCopy or checklistState" }, { status: 400 });
  }

  // Load the baseline graph in the same deterministic way as overview
  const { graph: baselineGraph, globallyReviewed } = buildMockOverview(reviewId);

  // Recompute required checklist items for validation (server authoritative)
  const requiredItems = expandRequiredChecklistItems(baselineGraph, {
    globallyReviewed: {
      personIds: new Set(globallyReviewed.personIds ?? []),
      organizationIds: new Set(globallyReviewed.organizationIds ?? []),
      collectionIds: new Set(globallyReviewed.collectionIds ?? []),
      pieceIds: new Set(globallyReviewed.pieceIds ?? []),
    },
  });

  // Build a map of submitted checks for quick lookup
  const submitted = new Set(
    checklistState
      .filter((c: any) => c && c.checked)
      .map((c: any) => `${c.entityType}:${c.entityId ?? ""}:${c.fieldPath}`),
  );

  const missing = requiredItems.filter(
    (it) => !submitted.has(`${it.entityType}:${it.entityId ?? ""}:${it.fieldPath}`),
  );

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "Incomplete checklist: some required items are not checked",
        missing: missing.slice(0, 100).map((m) => ({
          entityType: m.entityType,
          entityId: m.entityId ?? null,
          fieldPath: m.fieldPath,
          label: m.label,
        })),
        missingCount: missing.length,
      },
      { status: 400 },
    );
  }

  // Compute diffs between baseline and working copy (changed checklist field paths)
  const changed = computeChangedChecklistFieldPaths(baselineGraph as any, workingCopy as any);

  const changedFieldPaths = changed.map((c) => c.fieldPath);
  const changedUniqueByEntityType = changed.reduce<Record<string, Set<string>>>(
    (acc, c) => {
      acc[c.entityType] = acc[c.entityType] || new Set<string>();
      if (c.entityId) acc[c.entityType].add(c.entityId);
      else acc[c.entityType].add("__source__");
      return acc;
    },
    {},
  );
  const perEntityTouched: Record<string, number> = Object.fromEntries(
    Object.entries(changedUniqueByEntityType).map(([k, v]) => [k, v.size]),
  );

  // MOCK transactional apply: in a real implementation, here we would:
  // - Verify Review state and ownership (IN_REVIEW) via Prisma
  // - Apply CRUD changes in a single transaction and write AuditLog rows
  // - Upsert ReviewedEntity rows as per rules
  // - Flip Review and MMSource states to APPROVED

  const summary = {
    reviewId,
    overallComment: overallComment || null,
    requiredCount: requiredItems.length,
    submittedCheckedCount: submitted.size,
    changedCount: changedFieldPaths.length,
    entitiesTouched: perEntityTouched,
    changedFieldPathsSample: changedFieldPaths.slice(0, 100),
  };

  return NextResponse.json({ ok: true, summary });
}
