import "@/styles/globals.css";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";

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
    <html lang="en" className={inter.variable}>
      <body className="h-screen w-screen">
        <Providers>
          <div className="w-full h-full flex flex-col">{children}</div>
          <div id="modal"></div>
        </Providers>
      </body>
    </html>
  );
}
