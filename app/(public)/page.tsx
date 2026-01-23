import { Metadata } from "next";
import Link from "next/link";
import { URL_EXPLORE, URL_FEED, URL_REVIEW_LIST } from "@/utils/routes";
import NavBar from "@/ui/NavBar";
import AdminLink from "@/ui/AdminLink";
// import Metronome from "@/ui/Metronome";
import SnowballMetronome from "@/ui/SnowballMetronome";

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

export default function Home() {
  return (
    <>
      <NavBar isHome />
      <div className="flex flex-col items-center justify-center py-2 flex-1">
        <h1 className="mb-8 text-4xl font-bold">The Metronome Mark Database</h1>
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
