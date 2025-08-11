import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/utils/db";
import { REVIEW_STATE } from "@prisma/client";

function json(data: unknown, init?: any) {
  return NextResponse.json(data as any, init as any);
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return json({ error: "[gAUTH001] Unauthorized" }, { status: 401 });
    }
    const role = session.user.role;
    if (!role || !["REVIEWER", "ADMIN"].includes(role)) {
      return json({ error: "[gAUTH002] Forbidden: reviewer role required" }, { status: 403 });
    }

    const sources = await db.mMSource.findMany({
      where: {
        reviewState: { in: [REVIEW_STATE.PENDING, REVIEW_STATE.ABORTED] },
        reviews: { none: { state: REVIEW_STATE.IN_REVIEW } },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        link: true,
        permalink: true,
        createdAt: true,
        creator: { select: { id: true, name: true, email: true } },
        pieceVersions: {
          select: {
            pieceVersion: {
              select: {
                id: true,
                piece: {
                  select: {
                    id: true,
                    composer: { select: { id: true, firstName: true, lastName: true } },
                  },
                },
                movements: {
                  select: {
                    id: true,
                    _count: { select: { sections: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const data = sources.map((s) => {
      const composersMap = new Map<string, { id: string; firstName: string; lastName: string }>();
      let sectionsCount = 0;
      for (const pvJoin of s.pieceVersions) {
        const pv = pvJoin.pieceVersion;
        if (pv.piece?.composer) {
          const c = pv.piece.composer;
          composersMap.set(c.id, { id: c.id, firstName: c.firstName, lastName: c.lastName });
        }
        for (const m of pv.movements) {
          sectionsCount += (m as any)._count?.sections ?? 0;
        }
      }

      const composers = Array.from(composersMap.values());
      return {
        id: s.id,
        title: s.title ?? null,
        composers,
        link: s.link,
        permalink: s.permalink,
        enteredBy: s.creator,
        sectionsCount,
        creationDate: s.createdAt,
      };
    });

    return json({ items: data });
  } catch (err) {
    console.error("/api/mm-sources/to-review error:", err);
    return json({ error: "[gUNX003] Unexpected error" }, { status: 500 });
  }
}
