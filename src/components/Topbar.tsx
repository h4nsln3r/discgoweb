"use client";

import { useEffect, useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

type SlimUser = {
  email?: string;
};
export default function Topbar({ user }: { user: SlimUser | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showStickyIcon, setShowStickyIcon] = useState(false);

  // 🔽 Visa extra hamburgare efter scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setShowStickyIcon(true);
      } else {
        setShowStickyIcon(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Toppbar (ej sticky) */}
      <div className="flex items-center justify-between bg-gray-100 px-4 py-3 shadow-md">
        {/* 🍔 Hamburgare i topbar */}
        <button onClick={() => setMenuOpen(true)} aria-label="Öppna meny">
          <Bars3Icon className="w-7 h-7 text-gray-800" />
        </button>

        {/* Appnamn */}
        <div className="text-xl font-bold text-center">Discgolf App</div>

        {/* Inloggad + logga ut */}
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

      {/* 🧲 Sticky hamburgare efter scroll */}
      {showStickyIcon && (
        <div className="fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow-md transition-transform duration-300 animate-fade-in">
          <button onClick={() => setMenuOpen(true)} aria-label="Öppna meny">
            <Bars3Icon className="w-7 h-7 text-gray-800" />
          </button>
        </div>
      )}

      {/* 🔲 Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* 📋 Responsiv sidomeny */}
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
