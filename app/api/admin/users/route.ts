import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { getAdminUsers } from "@/utils/server/admin/getAdminUsers";

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

  const result = await getAdminUsers({
    cursor: searchParams.get("cursor"),
    limit,
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    role: searchParams.get("role"),
  });

  return NextResponse.json(result);
}
