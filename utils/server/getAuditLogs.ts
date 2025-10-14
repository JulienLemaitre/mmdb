import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { db } from "@/utils/server/db";
import { AUDIT_ENTITY_TYPE } from "@prisma/client";

export type AuditFilter =
  | { mode: "review"; reviewId: string; cursor?: string | null; limit?: number }
  | {
      mode: "entity";
      entityType: keyof typeof AUDIT_ENTITY_TYPE | string;
      entityId: string;
      cursor?: string | null;
      limit?: number;
    };

export type AuditItem = {
  id: string;
  reviewId: string | null;
  entityType: string;
  entityId: string | null;
  operation: string;
  before: any | null;
  after: any | null;
  authorId: string | null;
  createdAt: string;
  comment: string | null;
};

export type AuditResult = { items: AuditItem[]; nextCursor: string | null };

/**
 * Fetches AuditLog entries with simple validation and REVIEWER+ role guard.
 * Throws errors with messages starting by "Unauthorized" or "Forbidden" for mapping to HTTP.
 */
export async function getAuditLogs(filter: AuditFilter): Promise<AuditResult> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  const role = session.user.role;
  if (!role || !["REVIEWER", "ADMIN"].includes(role)) {
    throw new Error("Forbidden: reviewer role required");
  }

  const limitRaw = (filter as any).limit as number | undefined;
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw!, 1), 100)
    : 50;
  const cursor = (filter as any).cursor as string | undefined;

  let where: any = {};
  if (filter.mode === "review") {
    if (!filter.reviewId) throw new Error("reviewId is required");
    where.reviewId = filter.reviewId;
  } else if (filter.mode === "entity") {
    const et = (filter.entityType || "").toString().toUpperCase();
    const id = filter.entityId;
    if (!et || !id) throw new Error("entityType and entityId are required");
    // Validate against known enum values when available; fall back to pass-through
    const allowed = new Set(Object.keys(AUDIT_ENTITY_TYPE));
    if (!allowed.has(et)) {
      throw new Error(
        `Invalid entityType. Allowed: ${Array.from(allowed).join("|")}`,
      );
    }
    where.entityType = et as any;
    where.entityId = id;
  }

  // Order newest first. We use id DESC for cursor simplicity.
  const rows = await db.auditLog.findMany({
    where,
    orderBy: { id: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      reviewId: true,
      entityType: true,
      entityId: true,
      operation: true,
      before: true,
      after: true,
      authorId: true,
      createdAt: true,
      comment: true,
    },
  });

  const items: AuditItem[] = rows.map((r) => ({
    id: r.id,
    reviewId: r.reviewId,
    entityType: String(r.entityType),
    entityId: r.entityId,
    operation: String(r.operation),
    before: r.before as any,
    after: r.after as any,
    authorId: r.authorId,
    createdAt:
      (r.createdAt as any as Date).toISOString?.() ?? String(r.createdAt),
    comment: (r.comment as any) ?? null,
  }));

  const nextCursor =
    items.length === limit ? (items[items.length - 1]?.id ?? null) : null;
  return { items, nextCursor };
}
