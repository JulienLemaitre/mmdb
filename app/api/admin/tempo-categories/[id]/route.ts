import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import {
  AdminTempoActionError,
  deleteAdminTempoCategory,
} from "@/utils/server/admin/tempoCategoriesAdmin";

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
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

  const { id } = await props.params;

  try {
    const result = await deleteAdminTempoCategory(id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AdminTempoActionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/tempo-categories/[id] DELETE]", err);
    return NextResponse.json(
      { error: "Failed to delete tempo category" },
      { status: 500 },
    );
  }
}
