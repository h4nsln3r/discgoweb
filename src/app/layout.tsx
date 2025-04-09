// src/app/layout.tsx
import "../styles/global.scss";
import "./globals.css";

import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

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
        <Navbar />
        {children}
      </body>
    </html>
  );
}
