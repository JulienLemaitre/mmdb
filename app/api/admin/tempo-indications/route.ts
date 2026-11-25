import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { getAdminTempoIndications } from "@/utils/server/admin/getAdminTempoIndications";
import { AdminTempoIndicationSortOrder } from "@/types/adminTypes";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: admin role required" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw) ? limitRaw : undefined;
  const sortOrderRaw = searchParams.get("sortOrder");
  const sortOrder: AdminTempoIndicationSortOrder =
    sortOrderRaw === "asc" ? "asc" : "desc";

  const result = await getAdminTempoIndications({
    cursor: searchParams.get("cursor"),
    limit,
    sortOrder,
    categoryFilter: searchParams.get("categoryFilter"),
  });

  return NextResponse.json(result);
}
