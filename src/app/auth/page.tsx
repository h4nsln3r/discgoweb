"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { CenterToast } from "@/components/Toasts/CenterToast";

export default function AuthPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient<Database>(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
        if (!userId) {
          router.push("/dashboard");
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
          router.push("/dashboard");
          router.refresh();
          return;
        }

        const needsOnboarding = !profile || !profile.alias;

        if (needsOnboarding) {
          setToastTitle("Välkommen! 👋");
          setToastMessage("Fyll i profilen så kör vi!");
          setToastOpen(true);
          router.push("/profile?onboarding=1");
          router.refresh();
          return;
        }

        router.push("/dashboard");
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
        return;
      }

      // If session exists immediately (email verification OFF),
      // push them straight into onboarding.
      setToastTitle("Välkommen! 👋");
      setToastMessage("Fyll i profilen så kör vi!");
      setToastOpen(true);
      router.push("/profile?onboarding=1");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Något gick fel.");
    } finally {
      setLoading(false);
    }
  };

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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-300">
                    E-post
                  </label>
                  <input
                    className="w-full rounded-lg border border-retro-border bg-retro-card text-stone-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
                    type="email"
                    placeholder="E-post"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-300">
                    Lösenord
                  </label>
                  <input
                    className="w-full rounded-lg border border-retro-border bg-retro-card text-stone-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
                    type="password"
                    placeholder="Lösenord"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  className="w-full rounded-lg bg-retro-accent text-stone-100 py-2.5 font-medium hover:bg-retro-accent-hover transition disabled:opacity-50"
                >
                  {loading ? "Jobbar..." : isLogin ? "Logga in" : "Skapa konto"}
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
