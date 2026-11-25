import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import {
  AdminTempoActionError,
  createAdminTempoCategory,
  getAdminTempoCategories,
} from "@/utils/server/admin/tempoCategoriesAdmin";

async function requireAdmin() {
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
  return null;
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const items = await getAdminTempoCategories();
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name : "";

  try {
    const item = await createAdminTempoCategory(name);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    if (err instanceof AdminTempoActionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/tempo-categories POST]", err);
    return NextResponse.json(
      { error: "Failed to create tempo category" },
      { status: 500 },
    );
  }
}
