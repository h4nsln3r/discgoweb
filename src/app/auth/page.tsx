"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

function CenterToast({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean;
  title: string;
  message?: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            onClick={onClose}
            aria-label="Stäng"
            type="button"
          />

          <motion.div
            className="relative mx-4 w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-white/60 p-5"
            initial={{ y: 14, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-10 w-10 rounded-full bg-emerald-600/10 flex items-center justify-center">
                <span className="text-emerald-700 text-lg">✓</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{title}</p>
                {message && (
                  <p className="mt-1 text-sm text-gray-600">{message}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 transition"
                aria-label="Stäng toast"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-gray-100">
              <motion.div
                className="h-full bg-emerald-600"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4.5, ease: "linear" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function AuthPage() {
  const supabase = createSupabaseClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastMessage, setToastMessage] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (!toastOpen) return;
    const t = setTimeout(() => setToastOpen(false), 5000);
    return () => clearTimeout(t);
  }, [toastOpen]);

  const canSubmit = useMemo(() => {
    if (!email || !password) return false;
    return true;
  }, [email, password]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const userId = data.user?.id;
        if (!userId) {
          router.push("/dashboard");
          return;
        }

        // Check if profile exists / is "complete enough"
        const { data: profile, error: pErr } = await supabase
          .from("profiles")
          .select("id, alias")
          .eq("id", userId)
          .maybeSingle();

        if (pErr) {
          // If RLS blocks SELECT you'll see it here.
          // We'll still let user into dashboard for now.
          console.warn("[auth] profile check error:", pErr);
          router.push("/dashboard");
          return;
        }

        const needsOnboarding = !profile || !profile.alias;

        if (needsOnboarding) {
          setToastTitle("Välkommen! 👋");
          setToastMessage("Fyll i profilen så kör vi!");
          setToastOpen(true);

          // redirect to profile onboarding
          router.push("/profile?onboarding=1");
          return;
        }

        router.push("/dashboard");
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
    } catch (err: any) {
      setError(err.message ?? "Något gick fel.");
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
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/40">
              <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6">
                {isLogin ? "Logga in" : "Skapa konto"}
              </h1>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-800">
                    E-post
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="email"
                    placeholder="E-post"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-800">
                    Lösenord
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="password"
                    placeholder="Lösenord"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="w-full rounded-lg bg-emerald-600 text-white py-2.5 font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {loading ? "Jobbar..." : isLogin ? "Logga in" : "Skapa konto"}
                </button>
              </form>

              <button
                className="mt-4 w-full text-center text-sm text-gray-700 hover:text-gray-900"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                type="button"
              >
                {isLogin
                  ? "Har du inget konto? Skapa ett →"
                  : "Redan medlem? Logga in →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
