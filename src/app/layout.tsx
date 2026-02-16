// src/app/layout.tsx
import "../styles/global.scss";
import "./globals.css";

import type { Metadata } from "next";
import TopbarWrapper from "../components/Topbar/TopbarWrapper.server";
import Providers from "../components/Providers";

export const metadata: Metadata = {
  title: "Discgolf App",
  description: "Samla scores och tävla med vänner!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body
        className="min-h-screen bg-cover bg-center relative"
        style={{ backgroundImage: "url('/images/login-bg.png')" }}
      >
        <TopbarWrapper />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
