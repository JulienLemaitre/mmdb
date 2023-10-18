import { Metadata } from "next";
import Link from "next/link";
import { CONTRIBUTE_ROUTE } from "@/utils/routes";

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
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="flex flex-col items-stretch gap-2">
        <Link href="" className="btn">
          Explore
        </Link>
        <Link href={CONTRIBUTE_ROUTE} className="btn">
          Contribute
        </Link>
        <Link href="" className="btn">
          Review
        </Link>
      </div>
    </div>
  );
}
