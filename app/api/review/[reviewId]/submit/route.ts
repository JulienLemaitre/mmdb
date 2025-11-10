import { NextResponse } from "next/server";
import { getReviewOverview } from "@/utils/server/getReviewOverview";
import { computeChangedChecklistFieldPaths } from "@/features/review/reviewDiff";
import { composeAuditEntries } from "@/utils/auditCompose";
import { expandRequiredChecklistItems } from "@/features/review/utils/expandRequiredChecklistItems";
import { debug } from "@/utils/debugLogger";

// POST /api/review/[reviewId]/submit
// Body: { workingCopy, checklistState: Array<{entityType, entityId, fieldPath, checked}>, overallComment? }
// This mock implementation validates completeness server-side and computes diffs; it does not persist to DB yet.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const { reviewId } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    debug.error("Invalid JSON body");
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const workingCopy = body?.workingCopy;
  const checklistState = Array.isArray(body?.checklistState)
    ? body.checklistState
    : [];
  const overallComment = body?.overallComment ?? null;
  console.log(`[] workingCopy`, JSON.stringify(workingCopy, null, 2));
  console.log(`[] checklistState`, JSON.stringify(checklistState, null, 2));

  if (!workingCopy || !Array.isArray(checklistState)) {
    debug.error(
      `Missing : ${!workingCopy ? "workingCopy" : ""} ${!Array.isArray(checklistState) ? "checklistState" : ""}`,
    );
    return NextResponse.json(
      { error: "Missing workingCopy or checklistState" },
      { status: 400 },
    );
  }

  // Load the baseline graph from the real DB-backed overview
  let baselineGraph: any;
  let globallyReviewed: any;
  try {
    const ov = await getReviewOverview(reviewId);
    baselineGraph = ov.graph;
    globallyReviewed = ov.globallyReviewed;
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    const lc = msg.toLowerCase();
    let status = 500;
    if (lc.includes("unauthorized")) status = 401;
    else if (lc.startsWith("forbidden")) status = 403;
    else if (lc.includes("must be") || lc.includes("required")) status = 400;
    else if (lc.includes("not found")) status = 404;
    debug.error(`getReviewOverview error: ${status} ${msg}`);
    return NextResponse.json({ error: msg }, { status });
  }

  // Recompute required checklist items for validation (server authoritative)
  const requiredItems = expandRequiredChecklistItems(baselineGraph, {
    globallyReviewed: {
      personIds: new Set(globallyReviewed.personIds ?? []),
      organizationIds: new Set(globallyReviewed.organizationIds ?? []),
      collectionIds: new Set(globallyReviewed.collectionIds ?? []),
      pieceIds: new Set(globallyReviewed.pieceIds ?? []),
    },
  });
  debug.info(
    "requiredItems keys",
    requiredItems.map(
      (it) => `${it.entityType}:${it.entityId ?? ""}:${it.fieldPath}`,
    ),
  );

  // Build a map of submitted checks for quick lookup
  const submitted = new Set(
    checklistState.map(
      (c: any) => `${c.entityType}:${c.entityId ?? ""}:${c.fieldPath}`,
    ),
  );

  debug.info(`[] submitted`, JSON.stringify(submitted, null, 2));

  const missing = requiredItems.filter(
    (it) =>
      !submitted.has(`${it.entityType}:${it.entityId ?? ""}:${it.fieldPath}`),
  );
  debug.info(`[] missing`, JSON.stringify(missing, null, 2));

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
  const changed = computeChangedChecklistFieldPaths(
    baselineGraph as any,
    workingCopy as any,
  );

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

  // Compose audit entries preview (no DB write in mock)
  const auditPreview = composeAuditEntries(
    reviewId,
    baselineGraph as any,
    workingCopy as any,
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

  return NextResponse.json({
    ok: true,
    summary,
    auditPreview: {
      count: auditPreview.length,
      entries: auditPreview.slice(0, 100),
    },
  });
}
