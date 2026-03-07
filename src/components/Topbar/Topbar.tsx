"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Bars3Icon, XMarkIcon, UserCircleIcon, ArrowLeftIcon, PencilSquareIcon, PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LogoutButton from "../Buttons/LogoutButton";
import { useTopbarActions } from "./TopbarActionsContext";

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
  displayName: initialDisplayName,
  avatarUrl: initialAvatarUrl,
}: {
  user: SlimUser | null;
  displayName: string | null;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { actions: topbarActions } = useTopbarActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [displayName, setDisplayName] = useState<string | null>(initialDisplayName ?? null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl ?? null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [searchOpen]);

  const showSearch = pathname === "/competitions" || pathname === "/courses";
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    if (pathname === "/competitions") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", q);
      router.push(`/competitions?${params.toString()}`);
    } else if (pathname === "/courses") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", q);
      router.push(`/courses?${params.toString()}`);
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  // Synka med server-props vid mount/navigering
  useEffect(() => {
    setDisplayName(initialDisplayName ?? null);
    setAvatarUrl(initialAvatarUrl ?? null);
  }, [initialDisplayName, initialAvatarUrl]);

  // När användaren är på profilsidan, hämta färsk profil (t.ex. efter redigering)
  useEffect(() => {
    if (!user || pathname !== "/profile") return;
    let cancelled = false;
    fetch("/api/get-current-user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.alias != null) setDisplayName(data.alias);
        if (data.avatar_url !== undefined) setAvatarUrl(data.avatar_url ?? null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, pathname]);

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
      {/* Sticky topbar: vänster = meny + tillbaka, mitten = logga, höger = redigera + profil */}
      <div
        className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between bg-retro-surface/95 backdrop-blur-sm border-b border-retro-border px-3 py-2.5 md:px-3 md:py-4 shadow-lg transition-opacity duration-200 overflow-visible ${
          menuOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Vänster: meny + extra (t.ex. sortering) + tillbaka, vertikalt centrerade */}
        <div className="flex items-center gap-1 md:gap-2 min-w-0 flex-1 justify-start">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Öppna meny"
            className="p-1 md:p-1.5 rounded-lg hover:bg-retro-card transition shrink-0"
          >
            <Bars3Icon className="w-5 h-5 md:w-6 md:h-6 text-stone-200" />
          </button>
          {topbarActions.topbarExtraLeft != null && (
            <div className="shrink-0 -ml-0.5">{topbarActions.topbarExtraLeft}</div>
          )}
          {topbarActions.backHref && (
            <Link
              href={topbarActions.backHref}
              className="inline-flex items-center gap-1 p-1 md:p-1.5 rounded-lg hover:bg-retro-card text-stone-400 hover:text-stone-200 transition shrink-0"
              aria-label="Tillbaka"
            >
              <ArrowLeftIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:inline text-sm font-medium">Tillbaka</span>
            </Link>
          )}
        </div>

        {/* Mitten: logga/titel, vertikalt centrerad */}
        <div className="flex items-center justify-center min-w-0 flex-1 md:absolute md:left-1/2 md:-translate-x-1/2 md:flex-none">
          {topbarActions.pageTitle ? (
            <>
              {/* Mobil: bara sidtitel, ingen logga */}
              <span className="md:hidden font-bebas text-lg tracking-wide uppercase text-stone-100 truncate max-w-[180px] text-center">
                {topbarActions.pageTitle}
              </span>
              {/* Desktop: logga + titel bredvid */}
              <div className="hidden md:flex items-center gap-2.5">
                <Link
                  href="/dashboard"
                  className="flex items-center shrink-0 rounded-lg hover:opacity-90 transition"
                  aria-label="Till startsida"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo/logo.png"
                    alt=""
                    className="h-11 w-auto max-w-[160px] object-contain"
                  />
                </Link>
                <span className="font-bebas text-xl tracking-wide uppercase text-stone-100 whitespace-nowrap truncate max-w-[240px]">
                  {topbarActions.pageTitle}
                </span>
              </div>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center shrink-0 rounded-lg hover:opacity-90 transition"
              aria-label="Till startsida"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/logo.png"
                alt=""
                className="h-8 w-auto max-w-[90px] md:h-11 md:max-w-[160px] object-contain"
              />
            </Link>
          )}
        </div>

        {/* Höger: extra (t.ex. sortering) + primär knapp + redigera + profil */}
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1 justify-end">
          {topbarActions.topbarExtraRight != null && (
            <div className="shrink-0">{topbarActions.topbarExtraRight}</div>
          )}
          {topbarActions.primaryActionHref && topbarActions.primaryActionLabel && (
            <Link
              href={topbarActions.primaryActionHref}
              className="inline-flex items-center gap-1 p-1.5 md:p-2 md:px-3 rounded-lg bg-retro-accent text-stone-100 hover:bg-retro-accent-hover transition shrink-0"
              aria-label={topbarActions.primaryActionLabel}
            >
              <PlusIcon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
              <span className="hidden md:inline text-sm font-medium">{topbarActions.primaryActionLabel}</span>
            </Link>
          )}
          {topbarActions.editHref && (
            <Link
              href={topbarActions.editHref}
              className="inline-flex items-center gap-1 p-1 md:p-1.5 rounded-lg hover:bg-retro-card text-stone-400 hover:text-stone-200 transition shrink-0"
              aria-label={topbarActions.editLabel ?? "Redigera"}
            >
              <PencilSquareIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:inline text-sm font-medium">{topbarActions.editLabel ?? "Redigera"}</span>
            </Link>
          )}

          {/* Sök: endast på tävlingar och banor */}
          {showSearch && (
            <div className="relative shrink-0" ref={searchContainerRef}>
              <button
                type="button"
                onClick={() => setSearchOpen((o) => !o)}
                aria-expanded={searchOpen}
                aria-label="Sök"
                className="p-1.5 md:p-2 rounded-lg hover:bg-retro-card text-stone-300 hover:text-stone-200 transition"
              >
                <MagnifyingGlassIcon className="w-5 h-5 md:w-5 md:h-5" />
              </button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-1.5 w-72 rounded-xl border border-retro-border bg-retro-surface shadow-xl z-50 overflow-hidden p-2"
                  >
                    <form onSubmit={handleSearchSubmit}>
                      <div className="flex items-center gap-2 rounded-lg border border-retro-border bg-retro-card focus-within:ring-2 focus-within:ring-retro-accent focus-within:border-transparent">
                        <MagnifyingGlassIcon className="w-4 h-4 shrink-0 ml-2.5 text-stone-500" aria-hidden />
                        <input
                          ref={searchInputRef}
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={pathname === "/competitions" ? "Sök tävlingar…" : "Sök banor…"}
                          className="flex-1 min-w-0 py-2 pr-3 bg-transparent text-stone-100 text-sm placeholder:text-stone-500 focus:outline-none"
                          aria-label="Sök"
                        />
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <Link
            href="/profile"
            className="flex flex-col items-center min-w-0 rounded-lg hover:bg-retro-card transition pl-0.5 pr-0 pt-0 group -mt-5 -mb-6 md:-mt-4 md:pt-0 md:-mb-10 md:pr-0"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover border-2 border-retro-border shrink-0 group-hover:border-stone-500 transition-colors shadow-lg"
              />
            ) : (
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-retro-border flex items-center justify-center shrink-0 group-hover:border-stone-500 transition-colors shadow-lg bg-retro-card">
                <UserCircleIcon className="w-5 h-5 md:w-8 md:h-8 text-stone-400" />
              </div>
            )}
            <span className="text-xs md:text-sm font-bebas tracking-wide uppercase text-retro-accent group-hover:text-amber-300 truncate max-w-[100px] md:max-w-[110px] -mt-1.5 md:-mt-1 text-center leading-tight">
              {nameLabel}
            </span>
          </Link>
        </div>
      </div>

      {/* Spacer: tunn bar + profilbild som sticker ut under */}
      <div className="h-10 md:h-18 shrink-0" aria-hidden />

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
          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="flex items-center min-w-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/logo.png"
              alt=""
              className="h-12 w-auto max-w-[200px] object-contain"
            />
          </Link>
          <button onClick={() => setMenuOpen(false)} aria-label="Stäng meny" className="p-1 rounded hover:bg-retro-card shrink-0">
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
              href="/teams"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/teams")}
            >
              👥 Lag
            </Link>
          </li>
          <li>
            <Link
              href="/discs"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/discs")}
            >
              🥏 Discar
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
