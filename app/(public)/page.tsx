import { Metadata } from "next";
import Link from "next/link";
import { URL_EXPLORE, URL_FEED, URL_REVIEW_LIST } from "@/utils/routes";
import NavBar from "@/ui/NavBar";
import AdminLink from "@/ui/AdminLink";
import Metronome from "@/ui/Metronome";
import SnowballMetronome from "@/ui/SnowballMetronome";
import { db } from "@/utils/server/db";
import { REVIEW_STATE } from "@/prisma/client/enums";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import {
  getLeaderboard,
  LeaderboardPeriod,
} from "@/utils/server/getLeaderboard";

// Helper function to check if current date is in winter period (Dec, Jan, Feb)
function isWinterPeriod() {
  const now = new Date();
  const month = now.getMonth(); // 0 = January, 11 = December
  return [11, 0, 1].includes(month);
}

// Helper to format date for display
function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const metadata: Metadata = {
  title: "The Metronome Mark Database",
  icons: {
    icon: "./favicon.ico",
  },
};

type Props = {
  searchParams: Promise<{ period?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const isConnected = Boolean(session?.user);

  const resolvedSearchParams = await searchParams;
  const currentPeriod =
    (resolvedSearchParams.period as LeaderboardPeriod) || "this_week";

  const [
    totalMetronomeMarksCount,
    reviewedMetronomeMarksCount,
    leaderboardData,
  ] = isConnected
    ? await Promise.all([
        db.metronomeMark.count(),
        db.metronomeMark.count({
          where: { mMSource: { reviewState: REVIEW_STATE.APPROVED } },
        }),
        getLeaderboard(currentPeriod),
      ])
    : [null, null, null];

  const periods: { value: LeaderboardPeriod; label: string }[] = [
    { value: "this_week", label: "This week" },
    { value: "past_week", label: "Past week" },
    { value: "this_month", label: "This month" },
    { value: "past_month", label: "Past month" },
    { value: "all_time", label: "All time" },
  ];

  return (
    <div className="drawer drawer-end min-h-screen flex flex-col">
      <input
        type="checkbox"
        id="leaderboard-toggle"
        className="drawer-toggle"
        defaultChecked={Boolean(resolvedSearchParams.period)}
      />

      <div className="drawer-content flex flex-col min-h-screen">
        <NavBar isHome />

        <div className="flex flex-col items-center justify-center gap-8 px-4 py-8 max-w-md mx-auto flex-1">
          {/* Centered Main column: Actions & Main stats */}
          <div className="flex flex-col items-center justify-center w-full">
            <h1 className="mb-4 text-3xl font-bold text-center">
              The Metronome Mark Database
            </h1>

            {isConnected &&
              totalMetronomeMarksCount !== null &&
              reviewedMetronomeMarksCount !== null && (
                <div className="mb-6 w-full rounded-xl border border-base-300 bg-base-100 p-4 text-sm shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-base-content/70">
                      Metronome marks (total)
                    </span>
                    <span className="font-semibold text-md">
                      {totalMetronomeMarksCount}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-base-200 pt-2">
                    <span className="text-base-content/70">
                      Metronome marks (reviewed)
                    </span>
                    <span className="font-semibold text-md">
                      {reviewedMetronomeMarksCount}
                    </span>
                  </div>
                </div>
              )}

            <div className="flex flex-col items-stretch gap-4 w-full">
              <div className="flex justify-center my-4">
                {isWinterPeriod() ? <SnowballMetronome /> : <Metronome />}
              </div>
              <Link href={URL_EXPLORE} className="btn btn-primary">
                Explore data
              </Link>
              <Link href={URL_FEED} className="btn btn-primary">
                Enter new Metronome Marks data
              </Link>
              <Link href={URL_REVIEW_LIST} className="btn btn-primary">
                Review
              </Link>
              <AdminLink />
            </div>
          </div>
        </div>

        {/* The Vertical Tab fixed to the right of the screen */}
        {isConnected && leaderboardData && (
          <label
            htmlFor="leaderboard-toggle"
            className="fixed top-1/2 -translate-y-1/2 right-0 cursor-pointer bg-base-100 border-l border-y border-base-300 rounded-l-xl py-4 px-2.5 flex flex-col items-center justify-center font-bold shadow-lg select-none h-40 hover:bg-base-200 z-30"
          >
            <span
              className="text-xs tracking-wider uppercase text-secondary rotate-180"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
              }}
            >
              {`Leaderboard`}
            </span>
            <span className="text-xs rotate-90 mt-1">{`⚡`}</span>
          </label>
        )}
      </div>

      {/* Drawer Sidebar: Interactive Leaderboard */}
      {isConnected && leaderboardData && (
        <div className="drawer-side z-50">
          <label
            htmlFor="leaderboard-toggle"
            aria-label="close sidebar"
            className="drawer-overlay backdrop-blur-md"
          />

          <div className="w-96 md:w-[450px] max-w-[calc(100vw-3rem)] min-h-full bg-base-100 border-l border-base-300 p-6 shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold flex items-center gap-2">
                ⚡ Leaderboard
              </h2>
              <label
                htmlFor="leaderboard-toggle"
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </label>
            </div>

            {/* Date range display */}
            <div className="text-xs text-base-content/50 mb-4 font-medium">
              {leaderboardData.startDate && leaderboardData.endDate ? (
                <span>
                  Period: {formatDate(leaderboardData.startDate)} –{" "}
                  {formatDate(leaderboardData.endDate)}
                </span>
              ) : (
                <span>Period: All time records</span>
              )}
            </div>

            {/* Period Selector Tabs */}
            <div className="flex flex-wrap gap-1 mb-4">
              {periods.map((p) => (
                <Link
                  key={p.value}
                  href={`?period=${p.value}`}
                  className={`btn btn-xs ${
                    currentPeriod === p.value
                      ? "btn-secondary"
                      : "btn-outline btn-ghost"
                  }`}
                >
                  {p.label}
                </Link>
              ))}
            </div>

            {leaderboardData.items.length > 0 ? (
              <div className="space-y-3 flex-1">
                {leaderboardData.items.slice(0, 5).map((item) => {
                  const isTop1 = item.rank === 1;
                  const isTop2 = item.rank === 2;
                  const isTop3 = item.rank === 3;

                  return (
                    <div
                      key={item.userId}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isTop1
                          ? "bg-warning/10 border-warning/40"
                          : "bg-base-200/50 border-base-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Medals or Badge Rank */}
                        <span className="w-6 text-center font-bold text-base">
                          {isTop1
                            ? "🥇"
                            : isTop2
                              ? "🥈"
                              : isTop3
                                ? "🥉"
                                : `${item.rank}.`}
                        </span>

                        <div>
                          <div className="font-semibold text-sm flex items-center gap-1.5">
                            {item.userName ||
                              item.email?.split("@")[0] ||
                              "Anonymous"}
                            {item.userId === session?.user?.id && (
                              <span className="badge badge-xs badge-soft badge-secondary badge-outline">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-base-content/60">
                            {item.metronomeMarksEntered} entered •{" "}
                            {item.metronomeMarksReviewed} reviewed
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-sm text-secondary">
                          {item.totalActivity} pts
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-base-300 rounded-lg text-sm text-base-content/50 flex-1 flex items-center justify-center">
                No activity recorded on this period yet.
              </div>
            )}

            <p className="text-[11px] text-base-content/40 text-center mt-4">
              Keep up the great work! 🙌
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
