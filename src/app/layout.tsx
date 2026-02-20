// src/app/layout.tsx
import "../styles/global.scss";
import "./globals.css";

import type { Metadata } from "next";
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
    <html lang="sv">
      <body className="min-h-screen bg-retro-bg">
        <TopbarWrapper />
        <Providers>
          <div className="pt-6">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
