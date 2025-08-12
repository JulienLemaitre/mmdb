import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { db } from "@/utils/db";
import { REVIEW_STATE } from "@prisma/client";
import { authOptions } from "@/auth/options";

export default async function ReviewChecklistPlaceholder({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  const role = (session.user as any).role as string | undefined;
  if (!role || (role !== "REVIEWER" && role !== "ADMIN")) redirect("/");

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, creatorId: true, state: true },
  });
  if (!review) redirect("/review");

  const isOwner = review.creatorId === session.user.id;
  const isAdmin = role === "ADMIN";
  if (!isOwner && !isAdmin) redirect("/review");
  if (review.state !== REVIEW_STATE.IN_REVIEW) redirect("/review");

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-2 text-2xl font-semibold">Review in progress</h1>
      <p className="text-sm text-gray-700">Review ID: {review.id}</p>
      <p className="mt-4 text-gray-600">
        This is a placeholder for the Piece Review Checklist UI. Use the
        navigation or direct link to continue when the checklist is implemented.
      </p>
    </div>
  );
}
