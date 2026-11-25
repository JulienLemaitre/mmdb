import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import {
  addCategoryToTempoIndication,
  AdminTempoActionError,
  removeCategoryFromTempoIndication,
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

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await props.params;

  let body: { tempoCategoryId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tempoCategoryId =
    typeof body.tempoCategoryId === "string" ? body.tempoCategoryId.trim() : "";
  if (!tempoCategoryId) {
    return NextResponse.json(
      { error: "tempoCategoryId is required" },
      { status: 400 },
    );
  }

  try {
    const categories = await addCategoryToTempoIndication(id, tempoCategoryId);
    return NextResponse.json({ categories });
  } catch (err) {
    if (err instanceof AdminTempoActionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/tempo-indications/categories POST]", err);
    return NextResponse.json(
      { error: "Failed to link tempo category" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await props.params;

  const { searchParams } = new URL(req.url);
  let tempoCategoryId = searchParams.get("tempoCategoryId")?.trim() || "";

  if (!tempoCategoryId) {
    try {
      const body = (await req.json()) as { tempoCategoryId?: unknown };
      if (typeof body.tempoCategoryId === "string") {
        tempoCategoryId = body.tempoCategoryId.trim();
      }
    } catch {
      // ignore empty body when query param is also absent
    }
  }

  if (!tempoCategoryId) {
    return NextResponse.json(
      { error: "tempoCategoryId is required" },
      { status: 400 },
    );
  }

  try {
    const categories = await removeCategoryFromTempoIndication(
      id,
      tempoCategoryId,
    );
    return NextResponse.json({ categories });
  } catch (err) {
    if (err instanceof AdminTempoActionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/tempo-indications/categories DELETE]", err);
    return NextResponse.json(
      { error: "Failed to unlink tempo category" },
      { status: 500 },
    );
  }
}
