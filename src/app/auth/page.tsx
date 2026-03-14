"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { CenterToast } from "@/components/Toasts/CenterToast";

/** Säker redirect-URL: måste vara relativ path (börjar med /), ingen // eller extern URL. */
function getSafeRedirect(redirect: string | null): string | null {
  if (!redirect || typeof redirect !== "string") return null;
  const trimmed = redirect.trim();
  if (trimmed === "" || !trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed;
}

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get("redirect"));
  const supabase = useMemo(() => createClientComponentClient<Database>(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCheckingSession(false);
      if (user) {
        router.replace(redirectTo ?? "/profile");
        router.refresh();
      }
    });
  }, [supabase, router, redirectTo]);
  const [error, setError] = useState<string | null>(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const emailRef = useRef<HTMLDivElement>(null);
  const passwordRef = useRef<HTMLDivElement>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const invalid = new Set<string>();
    if (!email.trim()) invalid.add("email");
    if (!password.trim()) invalid.add("password");
    if (invalid.size > 0) {
      setInvalidFields(invalid);
      const first = invalid.has("email") ? emailRef.current : passwordRef.current;
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      setError("Fyll i e-post och lösenord.");
      return;
    }
    setInvalidFields(new Set());
    setLoading(true);

    try {
      if (isLogin) {
        // SIGN IN
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // if session exists, check profile
        const userId = data.user?.id;
        const postLoginUrl = redirectTo ?? "/dashboard";
        if (!userId) {
          router.push(postLoginUrl);
          router.refresh();
          return;
        }

        const { data: profile, error: pErr } = await supabase
          .from("profiles")
          .select("id, alias")
          .eq("id", userId)
          .maybeSingle();

        if (pErr) {
          console.warn("[auth] profile check error:", pErr);
          router.push(postLoginUrl);
          router.refresh();
          return;
        }

        const needsOnboarding = !profile || !profile.alias;

        if (needsOnboarding) {
          setToastTitle("Välkommen! 👋");
          setToastMessage("Fyll i profilen så kör vi!");
          setToastOpen(true);
          router.push("/profile/edit");
          router.refresh();
          return;
        }

        router.push(postLoginUrl);
        router.refresh();
        return;
      }

      // SIGN UP
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      // With email verification ON, session is usually null -> show toast + switch to login
      if (!data.session) {
        setToastTitle("Konto skapat 🎉");
        setToastMessage(
          "Kolla mailen och bekräfta kontot, sen kan du logga in."
        );
        setToastOpen(true);
        setIsLogin(true);
        setPassword("");
        setLoading(false);
        return;
      }

      // If session exists immediately (email verification OFF),
      // push them straight to edit profile.
      setToastTitle("Välkommen! 👋");
      setToastMessage("Fyll i profilen så kör vi!");
      setToastOpen(true);
      router.push("/profile/edit");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Något gick fel.");
      setLoading(false);
    }
    // Vid lyckad inloggning/redirect lämnar vi loading=true tills sidan byts
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-bg">
        <ArrowPathIcon className="w-8 h-8 text-retro-muted animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <>
      <CenterToast
        open={toastOpen}
        title={toastTitle}
        message={toastMessage}
        onClose={() => setToastOpen(false)}
      />

      <div
        className="min-h-screen bg-cover bg-center relative"
        style={{ backgroundImage: "url('/images/login-bg.png')" }}
      >
        <div className="absolute inset-0 bg-retro-bg/85" />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            <div className="bg-retro-surface backdrop-blur-md rounded-2xl shadow-xl p-8 border border-retro-border">
              <h1 className="text-2xl font-semibold text-stone-100 text-center mb-6">
                {isLogin ? "Logga in" : "Skapa konto"}
              </h1>

              <form onSubmit={handleAuth} className="space-y-4">
                <div ref={emailRef} className="space-y-2">
                  <label className="block text-sm font-medium text-stone-300">
                    E-post
                  </label>
                  <input
                    className={`w-full rounded-lg border bg-retro-card text-stone-100 px-3 py-2 focus:outline-none focus:ring-2 placeholder:text-stone-500 ${invalidFields.has("email") ? "border-red-500 ring-2 ring-red-500/50 focus:ring-red-500" : "border-retro-border focus:ring-retro-accent"}`}
                    type="email"
                    placeholder="E-post"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setInvalidFields((p) => { const n = new Set(p); n.delete("email"); return n; });
                    }}
                    required
                    autoComplete="email"
                  />
                </div>

                <div ref={passwordRef} className="space-y-2">
                  <label className="block text-sm font-medium text-stone-300">
                    Lösenord
                  </label>
                  <input
                    className={`w-full rounded-lg border bg-retro-card text-stone-100 px-3 py-2 focus:outline-none focus:ring-2 placeholder:text-stone-500 ${invalidFields.has("password") ? "border-red-500 ring-2 ring-red-500/50 focus:ring-red-500" : "border-retro-border focus:ring-retro-accent"}`}
                    type="password"
                    placeholder="Lösenord"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setInvalidFields((p) => { const n = new Set(p); n.delete("password"); return n; });
                    }}
                    required
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                </div>

                {error && (
                  <p className="text-sm text-amber-300 bg-amber-900/30 border border-amber-700/50 rounded-lg p-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-retro-accent text-stone-100 py-2.5 font-medium hover:bg-retro-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin shrink-0" aria-hidden />
                      {isLogin ? "Loggar in..." : "Skapar konto..."}
                    </>
                  ) : (
                    isLogin ? "Logga in" : "Skapa konto"
                  )}
                </button>

                <button
                  type="button"
                  className="w-full text-sm text-stone-400 hover:text-stone-200"
                  onClick={() => {
                    setIsLogin((v) => !v);
                    setError(null);
                  }}
                >
                  {isLogin
                    ? "Har du inget konto? Skapa ett"
                    : "Har du redan ett konto? Logga in"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
