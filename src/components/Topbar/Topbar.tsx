"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Bars3Icon, XMarkIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import LogoutButton from "../Buttons/LogoutButton";

function navLinkClass(href: string, pathname: string, baseClass: string, highlight?: boolean) {
  const isActive =
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");
  const activeClass = isActive ? "bg-retro-card text-retro-accent font-semibold border-l-4 border-retro-accent pl-3 -ml-1 rounded-r" : "";
  const highlightClass = highlight ? "ring-2 ring-retro-accent ring-offset-2 ring-offset-retro-surface animate-pulse" : "";
  return `${baseClass} ${activeClass} ${highlightClass}`.trim();
}

type SlimUser = {
  email?: string;
};

export default function Topbar({
  user,
  displayName,
}: {
  user: SlimUser | null;
  displayName: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const isProfileWelcome = (pathname === "/profile" || pathname?.startsWith("/profile")) && searchParams.get("welcome") != null;

  const linkClass = (href: string, highlight = false) =>
    navLinkClass(
      href,
      pathname ?? "",
      "block py-2 px-2 -mx-2 rounded hover:bg-retro-surface text-stone-200 transition",
      highlight
    );

  const nameLabel = (displayName?.trim() ?? "") || "NAMN404";

  // Rendera inget alls om man inte är inloggad
  if (!user) return null;

  return (
    <>
      {/* Sticky topbar: meny-ikon vänster, profil + namn höger. Döljs när meny är öppen */}
      <div
        className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between bg-retro-surface/95 backdrop-blur-sm border-b border-retro-border px-4 py-2.5 shadow-lg transition-opacity duration-200 ${
          menuOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Öppna meny"
          className="p-1.5 rounded-lg hover:bg-retro-card transition"
        >
          <Bars3Icon className="w-6 h-6 text-stone-200" />
        </button>

        <Link
          href="/profile"
          className="flex items-center gap-2 min-w-0 rounded-lg hover:bg-retro-card transition px-2 py-1.5"
        >
          <UserCircleIcon className="w-6 h-6 text-stone-300 shrink-0" />
          <span className="text-sm font-medium text-stone-100 truncate max-w-[140px] sm:max-w-[200px]">
            {nameLabel}
          </span>
        </Link>
      </div>

      {/* Spacer så att innehåll inte hamnar under fixed topbar */}
      <div className="h-12 shrink-0" aria-hidden />

      {/* 🔲 Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* 📋 Sidomeny */}
      <div
        className={`fixed top-0 left-0 h-full w-64 max-w-[80%] sm:max-w-xs bg-retro-surface border-r border-retro-border shadow-xl z-50 transform transition-transform duration-300 overflow-y-auto ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 flex justify-between items-center border-b border-retro-border">
          <h2 className="text-lg font-semibold text-stone-100">Meny</h2>
          <button onClick={() => setMenuOpen(false)} aria-label="Stäng meny" className="p-1 rounded hover:bg-retro-card">
            <XMarkIcon className="w-6 h-6 text-stone-300" />
          </button>
        </div>

        <ul className="p-5 space-y-1 text-base">
          <li>
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/dashboard")}
            >
              🏠 Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/competitions"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/competitions")}
            >
              👑 Tävlingar
            </Link>
          </li>
          <li></li>
          <li>
            <Link
              href="/results"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/results")}
            >
              🥏 Resultat
            </Link>
          </li>

          <li>
            <Link
              href="/courses"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/courses")}
            >
              🏞️ Alla banor
            </Link>
          </li>
          <li>
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/profile", isProfileWelcome)}
            >
              👤 Min profil
            </Link>
          </li>
          <li>
            <LogoutButton
              onAfterClick={() => setMenuOpen(false)}
              className="block w-full text-left py-1 text-amber-400 hover:text-amber-300 font-medium transition"
            />
          </li>
        </ul>
      </div>
    </>
  );
}
