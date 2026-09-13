import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { redirect } from "next/navigation";
import { db } from "@/utils/server/db";
import NavBar from "@/ui/NavBar";
import UserMMSourcesTable, {
  UserMMSourceItem,
} from "@/features/dashboard/UserMMSourcesTable";
import {
  mMSourceInclude,
  tempoIndicationSelect,
} from "@/types/prismaSelections";
import { MMSourceFull } from "@/types/dbTypes";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const reason = typeof params?.reason === "string" ? params.reason : undefined;
  const reasonMessage =
    reason === "notOwner"
      ? "You can only edit MM Sources that you have contributed."
      : reason === "notPending"
        ? "This MM Source cannot be edited because it is no longer pending review."
        : reason === "inReview"
          ? "A review is currently in progress on this MM Source."
          : reason === "notFound"
            ? "The requested MM Source was not found."
            : undefined;

  const [rawSources, tempoIndications] = await Promise.all([
    db.mMSource.findMany({
      where: { creatorId: session.user.id },
      include: {
        ...mMSourceInclude,
        reviews: {
          where: { state: "IN_REVIEW" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.tempoIndication.findMany({
      select: tempoIndicationSelect,
    }),
  ]);

  const items: UserMMSourceItem[] = rawSources.map((mMSource) => {
    const hasActiveReview = mMSource.reviews.length > 0;
    const fullSource: MMSourceFull = {
      ...mMSource,
      pieceVersions: mMSource.pieceVersions.map((pvs) => ({
        ...pvs,
        pieceVersion: {
          ...pvs.pieceVersion,
          movements: pvs.pieceVersion.movements.map((mv) => ({
            ...mv,
            sections: mv.sections.map((section) => ({
              ...section,
              metronomeMarks: mMSource.metronomeMarks.filter(
                (mm) => mm.sectionId === section.id,
              ),
            })),
          })),
        },
      })),
    };

    return {
      source: fullSource,
      hasActiveReview,
    };
  });

  return (
    <div className="min-h-screen flex flex-col bg-base-200/30">
      <NavBar title="Dashboard" />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {reasonMessage && (
            <div className="alert alert-warning shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{reasonMessage}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-base-200">
            <div>
              <h1 className="text-2xl font-bold text-base-content">
                My MM Sources
              </h1>
              <p className="text-sm text-base-content/60 mt-1">
                Manage and track review status for your contributed metronome mark
                sources.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-neutral font-medium">
                {items.length} {items.length === 1 ? "source" : "sources"}
              </span>
            </div>
          </div>

          <UserMMSourcesTable
            items={items}
            tempoIndications={tempoIndications}
          />
        </div>
      </main>
    </div>
  );
}
