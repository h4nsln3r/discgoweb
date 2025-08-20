// src/app/layout.tsx
import "../styles/global.scss";
import "./globals.css";

import type { Metadata } from "next";
import TopbarWrapper from "../components/Topbar/TopbarWrapper.server";

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
      <body>
        <TopbarWrapper />
        {children}
      </body>
    </html>
  );
}
