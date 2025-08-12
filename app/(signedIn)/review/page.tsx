import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { redirect } from "next/navigation";
import { db } from "@/utils/db";
import React from "react";
import { REVIEW_STATE } from "@prisma/client";
import ReviewListClient from "./reviewListClient";
import { getToReviewFromDb } from "@/utils/server/review";

export default async function ReviewListPage() {
  const session = await getServerSession(authOptions);
  console.log(`[ReviewListPage] session :`, session);
  if (!session || !session.user) {
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
    redirect(`/review/${active.id}`);
  }

  const data = await getToReviewFromDb().catch((e) => {
    console.error(
      `[ReviewListPage] Error fetching data:`,
      e instanceof Error ? e.message : e,
    );
    return { items: [] };
  });
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">MM Sources to review</h1>
      <ReviewListClient items={data.items} />
    </div>
  );
}
