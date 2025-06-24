"use client";

import { useEffect, useRef, useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import LogoutButton from "../Buttons/LogoutButton";

type SlimUser = {
  email?: string;
};

export default function Topbar({ user }: { user: SlimUser | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showStickyIcon, setShowStickyIcon] = useState(false);
  const lastScrollY = useRef(0);

  // 🔽 Visa hamburgare när man scrollar ner, dölj när man scrollar upp
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 100 && currentScrollY > lastScrollY.current) {
        setShowStickyIcon(true); // Scrollar ner
      } else if (currentScrollY < lastScrollY.current) {
        setShowStickyIcon(false); // Scrollar upp
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Toppbar (ej sticky) */}
      <div className="flex items-center justify-between bg-gray-100 px-4 py-3 shadow-md">
        <button onClick={() => setMenuOpen(true)} aria-label="Öppna meny">
          <Bars3Icon className="w-7 h-7 text-gray-800" />
        </button>

        <div className="text-xl font-bold text-center">Discgolf App</div>

        <div className="flex items-center gap-2 text-sm text-gray-700">
          {user ? (
            <>
              <span className="hidden sm:inline">
                Inloggad som {user.email ?? "Okänd användare"}
              </span>
              <LogoutButton />
            </>
          ) : (
            <Link href="/auth" className="text-blue-600 hover:underline">
              Logga in
            </Link>
          )}
        </div>
      </div>

      {/* 🧲 Sticky hamburgare som animeras in/ut */}
      <div
        className={`fixed top-0 left-4 z-50 bg-white p-2 rounded-full shadow-md transition-all duration-300 ${
          showStickyIcon
            ? "translate-y-4 opacity-100 pointer-events-auto"
            : "-translate-y-20 opacity-0 pointer-events-none"
        }`}
      >
        <button onClick={() => setMenuOpen(true)} aria-label="Öppna meny">
          <Bars3Icon className="w-7 h-7 text-gray-800" />
        </button>
      </div>

      {/* 🔲 Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* 📋 Sidomeny */}
      <div
        className={`fixed top-0 left-0 h-full w-64 max-w-[80%] sm:max-w-xs bg-white shadow-md z-50 transform transition-transform duration-300 overflow-y-auto ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Meny</h2>
          <button onClick={() => setMenuOpen(false)} aria-label="Stäng meny">
            <XMarkIcon className="w-6 h-6 text-gray-800" />
          </button>
        </div>

        <ul className="p-5 space-y-4 text-base">
          <li>
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="block hover:text-blue-600 transition"
            >
              🏠 Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/competitions"
              onClick={() => setMenuOpen(false)}
              className="block hover:text-blue-600 transition"
            >
              👑 Tävlingar
            </Link>
          </li>
          <li></li>
          <li>
            <Link
              href="/results"
              onClick={() => setMenuOpen(false)}
              className="block hover:text-blue-600 transition"
            >
              🥏 Resultat
            </Link>
          </li>
          <li>
            <Link
              href="/results/new"
              onClick={() => setMenuOpen(false)}
              className="block hover:text-blue-600 transition"
            >
              ➕ Lägg till resultat
            </Link>
          </li>

          <li>
            <Link
              href="/courses"
              onClick={() => setMenuOpen(false)}
              className="block hover:text-blue-600 transition"
            >
              🏞️ Alla banor
            </Link>
          </li>
          <li>
            <Link
              href="/courses/new"
              onClick={() => setMenuOpen(false)}
              className="block hover:text-blue-600 transition"
            >
              ➕ Lägg till bana
            </Link>
          </li>
          <li>
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="block hover:text-blue-600 transition"
            >
              👤 Min profil
            </Link>
          </li>
          <li>
            <Link
              href="/auth"
              onClick={() => setMenuOpen(false)}
              className="block hover:text-red-600 transition"
            >
              🚪 Logga ut
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
