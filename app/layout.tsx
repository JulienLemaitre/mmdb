import "@/styles/globals.css";
import React from "react";
import { Inter } from "next/font/google";
import Providers from "@/ui/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { MODAL_AREA_ID } from "@/utils/constants";
import isDev from "@/utils/envVariable/isDev";
import isStaging from "@/utils/envVariable/isStaging";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const envLabel = isDev ? "LOCAL" : isStaging ? "STAGING" : null;
  const envBadgeClass = isDev ? "bg-yellow-300" : "bg-orange-400";

  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen w-screen`}>
        <Providers>
          <div className="w-full h-full flex flex-col">{children}</div>
          <div id="modal"></div>
        </Providers>
        <SpeedInsights />
        <Analytics />
        <div id={MODAL_AREA_ID}></div>
        {envLabel ? (
          <div
            className={`fixed bottom-4 right-4 z-50 rounded-full px-3 py-1 text-xs font-semibold text-black shadow ${envBadgeClass}`}
          >
            {envLabel}
          </div>
        ) : null}
      </body>
    </html>
  );
}
