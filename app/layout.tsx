import "@/styles/globals.css";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { MODAL_AREA_ID } from "@/utils/constants";

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
  return (
    <html lang="en">
      <body className={`${inter.variable} h-screen w-screen`}>
        <Providers>
          <div className="w-full h-full flex flex-col">{children}</div>
          <div id="modal"></div>
        </Providers>
        <SpeedInsights />
        <Analytics />
        <div id={MODAL_AREA_ID}></div>
      </body>
    </html>
  );
}
