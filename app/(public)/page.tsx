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
import { getLeaderboard } from "@/utils/server/getLeaderboard";

// Helper function to check if current date is in winter period (Dec, Jan, Feb)
function isWinterPeriod() {
  const now = new Date();
  const month = now.getMonth(); // 0 = January, 11 = December
  return [11, 0, 1].includes(month);
}

// keep counts reasonably fresh without forcing full dynamic SSR
export const revalidate = 60;

export const metadata: Metadata = {
  title: "The Metronome Mark Database",
  icons: {
    icon: "./favicon.ico",
    // shortcut: '/shortcut-icon.png',
    // apple: '/apple-icon.png',
    // other: {
    //   rel: 'apple-touch-icon-precomposed',
    //   url: '/apple-touch-icon-precomposed.png',
    // },
  },
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isConnected = Boolean(session?.user);

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
        getLeaderboard(),
      ])
    : [null, null, null];

  console.log(`[] leaderboardData :`, leaderboardData);

  return (
    <>
      <NavBar isHome />
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 px-4 py-8 max-w-4xl mx-auto flex-1">
        {/* Left column: Actions & Main stats */}
        <div className="flex flex-col items-center justify-center w-full lg:max-w-xs">
          <h1 className="mb-4 text-3xl font-bold text-center lg:text-left">
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
                  <span className="font-semibold text-lg">
                    {totalMetronomeMarksCount}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-base-200 pt-2">
                  <span className="text-base-content/70">
                    Metronome marks (reviewed)
                  </span>
                  <span className="font-semibold text-lg text-success">
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

        {/* Right column: Weekly Leaderboard */}
        {isConnected && leaderboardData && leaderboardData.items.length > 0 && (
          <div className="w-full lg:max-w-sm rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                ⚡ Weekly Leaderboard
              </h2>
              <span className="badge badge-sm badge-accent">Active</span>
            </div>

            <div className="space-y-3">
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
                            <span className="text-[10px] uppercase tracking-wider bg-primary/20 text-primary-content px-1.5 py-0.5 rounded font-extrabold">
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

            <p className="text-[11px] text-base-content/40 text-center mt-4">
              Updated every 60 seconds. Keep up the great work! 🙌
            </p>
          </div>
        )}
      </div>
    </>
  );
}
