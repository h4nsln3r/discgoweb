// src/app/layout.tsx
import "../styles/global.scss";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
