// src/app/layout.tsx
import { Bebas_Neue } from "next/font/google";
import "../styles/global.scss";
import "./globals.css";

import type { Metadata } from "next";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
import TopbarWrapper from "../components/Topbar/TopbarWrapper.server";
import Providers from "../components/Providers";

export const metadata: Metadata = {
  title: "Discgo",
  description: "Samla scores och tävla med vänner!",
  icons: {
    icon: "/logo/disco.png",
    apple: "/logo/disco.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className={bebasNeue.variable}>
      <body className="min-h-screen bg-retro-bg">
        <TopbarWrapper />
        <Providers>
          <div className="pt-6">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
