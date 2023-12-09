import { Metadata } from "next";
import Link from "next/link";
import { EDITION_COMPOSER_URL, EXPLORE_URL } from "@/utils/routes";
import NavBar from "@/app/NavBar";

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
      <NavBar title="Home" />
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <h1 className="mb-8 text-4xl font-bold">The Metronome Mark Database</h1>
        <div className="flex flex-col items-stretch gap-6 w-full max-w-xs">
          <Link href={EXPLORE_URL} className="btn btn-primary">
            Explore
          </Link>
          <Link href={EDITION_COMPOSER_URL} className="btn btn-primary">
            Edit
          </Link>
          <button className="btn btn-disabled">Review</button>
        </div>
      </div>
    </>
  );
}
