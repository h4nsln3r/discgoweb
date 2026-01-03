"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import OnboardingForm from "@/components/OnboardingForm"; // 👈 vi återanvänder

export default function AuthPage() {
  const supabase = createSupabaseClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        return;
      }

      // SIGN UP
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // Om du använder e-postbekräftelse i miljön, sätt redirect (valfritt):
        // options: { emailRedirectTo: `${location.origin}/auth/callback` }
      });
      if (error) throw error;

      // Om din Supabase har e-postbekräftelse PÅ kommer data.session ofta vara null
      if (!data.session) {
        // visa info till användaren istället för att gå vidare till onboarding
        setError(
          "Konto skapat. Kolla din e-post och bekräfta kontot innan du fortsätter."
        );
        return;
      }

      // annars: vi har en session direkt → visa onboarding-komponenten på samma sida
      setShowOnboarding(true);
    } catch (err: any) {
      setError(err.message ?? "Något gick fel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: "url('/images/login-bg.png')" }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/40">
          {!showOnboarding ? (
            <>
              <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6">
                {isLogin ? "Logga in" : "Skapa konto"}
              </h1>

              <form onSubmit={handleAuth} className="space-y-4">
                <input
                  className="w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  type="email"
                  placeholder="E-post"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  className="w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  type="password"
                  placeholder="Lösenord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 text-white py-2.5 font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {loading ? "Jobbar..." : isLogin ? "Logga in" : "Skapa konto"}
                </button>
              </form>

              <button
                className="mt-4 w-full text-center text-sm text-gray-700 hover:text-gray-900"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin
                  ? "Har du inget konto? Skapa ett →"
                  : "Redan medlem? Logga in →"}
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6">
                Välj namn & profilbild
              </h1>
              <OnboardingForm profile={null} courses={[]} />
              {/* 👆 du kan fylla på props genom fetch senare, men detta räcker för start */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
