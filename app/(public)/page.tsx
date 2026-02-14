import { Metadata } from "next";
import Link from "next/link";
import { URL_EXPLORE, URL_FEED, URL_REVIEW_LIST } from "@/utils/routes";
import NavBar from "@/ui/NavBar";
import AdminLink from "@/ui/AdminLink";
// import Metronome from "@/ui/Metronome";
import SnowballMetronome from "@/ui/SnowballMetronome";
import { db } from "@/utils/server/db";
import { REVIEW_STATE } from "@/prisma/client/enums";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";

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

  const [totalMetronomeMarksCount, reviewedMetronomeMarksCount] = isConnected
    ? await Promise.all([
        db.metronomeMark.count(),
        db.metronomeMark.count({
          where: { mMSource: { reviewState: REVIEW_STATE.APPROVED } },
        }),
      ])
    : [null, null];

  return (
    <>
      <NavBar isHome />
      <div className="flex flex-col items-center justify-center py-2 flex-1">
        <h1 className="mt-4 mb-4 text-4xl font-bold">
          The Metronome Mark Database
        </h1>

        {isConnected &&
          totalMetronomeMarksCount !== null &&
          reviewedMetronomeMarksCount !== null && (
            <div className="mb-6 w-full max-w-xs rounded border border-base-300 bg-base-100 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-base-content/70">
                  Metronome marks (total)
                </span>
                <span className="font-semibold">
                  {totalMetronomeMarksCount}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-base-content/70">
                  Metronome marks (reviewed)
                </span>
                <span className="font-semibold">
                  {reviewedMetronomeMarksCount}
                </span>
              </div>
            </div>
          )}

        <div className="flex flex-col items-stretch gap-6 w-full max-w-xs">
          <div className="flex justify-center">
            <SnowballMetronome />
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
    </>
  );
}
