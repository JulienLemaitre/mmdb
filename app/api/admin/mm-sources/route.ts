import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { getAdminMMSources } from "@/utils/server/admin/getAdminMMSources";

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

  const result = await getAdminMMSources({
    cursor: searchParams.get("cursor"),
    limit,
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    reviewState: searchParams.get("reviewState"),
  });

  return NextResponse.json(result);
}
