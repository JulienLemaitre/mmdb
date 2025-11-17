import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { redirect } from "next/navigation";
import { db } from "@/utils/server/db";
import React from "react";
import { REVIEW_STATE } from "@prisma/client";
import ReviewListClient from "./reviewListClient";
import { getToReviewFromDb } from "@/utils/server/getToReviewFromDb";
import { GET_URL_REVIEW_CHECKLIST } from "@/utils/routes";

export const dynamic = "force-dynamic";

export default async function ReviewListPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  const role = (session.user as any).role as string | undefined;
  if (!role || (role !== "REVIEWER" && role !== "ADMIN")) {
    console.warn(`[ReviewListPage] Role not allowed here: ${role}`);
    redirect("/");
  }

  // Routing guard: if the reviewer has an active IN_REVIEW review, redirect to its checklist
  const active = await db.review.findFirst({
    where: { creatorId: session.user.id, state: REVIEW_STATE.IN_REVIEW },
    select: { id: true },
  });
  if (active) {
    redirect(GET_URL_REVIEW_CHECKLIST(active.id));
  }

  const data = await getToReviewFromDb().catch((e) => {
    console.error(
      `[ReviewListPage] Error fetching data:`,
      e instanceof Error ? e.message : e,
    );
    return { items: [] };
  });

  const reason = (
    typeof params?.reason === "string" ? params?.reason : undefined
  ) as "notOwner" | "notActive" | "notFound" | "unauthorized" | undefined;
  const reasonMessage =
    reason === "notOwner"
      ? "You cannot access that review. Only the assigned reviewer or an admin can open it."
      : reason === "notActive"
        ? "That review is not active anymore."
        : reason === "notFound"
          ? "The requested review was not found."
          : reason === "unauthorized"
            ? "Please sign in to access reviews."
            : undefined;

  return (
    <div className="container mx-auto p-4">
      {reasonMessage && (
        <div className="mb-3 rounded border border-yellow-300 bg-yellow-50 p-2 text-sm text-yellow-800">
          {reasonMessage}
        </div>
      )}
      <h1 className="text-2xl font-semibold mb-4">MM Sources to review</h1>
      <ReviewListClient items={data.items} />
    </div>
  );
}
