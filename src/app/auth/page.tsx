"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

type Course = { id: string; name: string };

type PendingProfile = {
  alias: string;
  phone: string;
  homeCourse: string;
  favoriteDisc: string;
  city: string;
  team: string;
  avatarDataUrl?: string | null;
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string) {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:(.*);base64/.exec(meta)?.[1] ?? "application/octet-stream";
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

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

  // Rollgardin / extra signup fields
  const [showSignupDetails, setShowSignupDetails] = useState(false);

  // profile fields
  const [alias, setAlias] = useState("");
  const [phone, setPhone] = useState("+46");
  const [homeCourse, setHomeCourse] = useState("");
  const [favoriteDisc, setFavoriteDisc] = useState("");
  const [city, setCity] = useState("");
  const [team, setTeam] = useState("");

  // avatar file (for immediate signup sessions)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // courses (if you later want to fill)
  const [courses, setCourses] = useState<Course[]>([]);

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
    if (isLogin) return true;
    // signup: first click opens details, second submits
    if (!showSignupDetails) return true;
    return alias.trim().length > 0;
  }, [email, password, isLogin, showSignupDetails, alias]);

  // Upload avatar for cases where we DO have a session immediately
  async function uploadAvatarNow(userId: string) {
    if (!avatarFile) return null;

    const ext = avatarFile.type === "image/png" ? "png" : "jpg";
    const filePath = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl ?? null;
  }

  async function applyPendingProfile(loginEmail: string) {
    const key = `pending_profile:${loginEmail}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;

    let pending: PendingProfile | null = null;
    try {
      pending = JSON.parse(raw);
    } catch {
      localStorage.removeItem(key);
      return;
    }

    // Upload avatar from dataUrl (after confirmation)
    let avatarUrl = "";
    if (pending?.avatarDataUrl) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const blob = dataUrlToBlob(pending.avatarDataUrl);
        const ext = blob.type === "image/png" ? "png" : "jpg";
        const filePath = `${user.id}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, blob, { upsert: true, contentType: blob.type });

        if (!uploadError) {
          const { data } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
          avatarUrl = data.publicUrl ?? "";
        }
      }
    }

    await fetch("/api/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alias: pending?.alias ?? "",
        avatar_url: avatarUrl,
        home_course: pending?.homeCourse || null,
        phone: pending?.phone?.trim() || null,
        favorite_disc: pending?.favoriteDisc?.trim() || null,
        city: pending?.city?.trim() || null,
        team: pending?.team?.trim() || null,
      }),
    });

    localStorage.removeItem(key);
  }

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

        // ✅ After confirmed e-mail, first login → write pending profile to DB
        try {
          await applyPendingProfile(email);
        } catch {
          // ignore
        }

        router.push("/dashboard");
        return;
      }

      // SIGNUP: first click opens rollgardin
      if (!showSignupDetails) {
        setShowSignupDetails(true);
        setLoading(false);
        return;
      }

      // SIGNUP: actually create account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      // If e-mail confirmation is ON, session may be null here.
      if (!data.session) {
        // Store the extra fields locally so the user can finish after verifying.
        try {
          const avatarDataUrl = avatarFile
            ? await fileToDataUrl(avatarFile)
            : null;

          localStorage.setItem(
            `pending_profile:${email}`,
            JSON.stringify({
              alias,
              phone,
              homeCourse,
              favoriteDisc,
              city,
              team,
              avatarDataUrl,
            } satisfies PendingProfile)
          );
        } catch {
          // ignore
        }

        // ✅ Center toast feedback
        setToastTitle("Konto skapat 🎉");
        setToastMessage(
          "Kolla din e-post och bekräfta kontot. När du loggar in första gången sparas profilen automatiskt."
        );
        setToastOpen(true);

        // switch view to login
        setIsLogin(true);
        setPassword("");
        setLoading(false);
        return;
      }

      // If session exists immediately, we can upsert now
      const userId = data.session.user.id;
      const avatarUrl = await uploadAvatarNow(userId);

      const res = await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias,
          avatar_url: avatarUrl ?? "",
          home_course: homeCourse || null,
          phone: phone?.trim() || null,
          favorite_disc: favoriteDisc?.trim() || null,
          city: city?.trim() || null,
          team: team?.trim() || null,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "Kunde inte spara profilen.");
      }

      router.push("/dashboard");
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

                <AnimatePresence initial={false}>
                  {!isLogin && showSignupDetails && (
                    <motion.div
                      className="space-y-3 overflow-hidden rounded-xl border border-white/60 bg-white/50 p-4"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                    >
                      <p className="text-sm text-gray-700">
                        Fyll i din profil (du kan ändra allt senare).
                      </p>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-700">
                          Namn / Alias
                        </label>
                        <input
                          className="w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={alias}
                          onChange={(e) => setAlias(e.target.value)}
                          placeholder="t.ex. Hannes"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-700">
                          Profilbild (valfritt)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setAvatarFile(e.target.files?.[0] ?? null)
                          }
                        />
                        <p className="text-xs text-gray-500">
                          Om du måste bekräfta mail så laddas bilden upp efter
                          första inloggningen.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-700">
                          Telefonnummer
                        </label>
                        <input
                          className="w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+46..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-700">
                          Hemmabana
                        </label>
                        <select
                          className="w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={homeCourse}
                          onChange={(e) => setHomeCourse(e.target.value)}
                        >
                          <option value="">Välj bana (valfritt)</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500">
                          Saknar du din bana? Lägg till den efter att kontot är
                          skapat.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-700">
                            Favoritdisc
                          </label>
                          <input
                            className="w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={favoriteDisc}
                            onChange={(e) => setFavoriteDisc(e.target.value)}
                            placeholder="t.ex. Destroyer"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-700">
                            Stad
                          </label>
                          <input
                            className="w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="t.ex. Malmö"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-700">
                          Lag
                        </label>
                        <input
                          className="w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={team}
                          onChange={(e) => setTeam(e.target.value)}
                          placeholder="t.ex. Malmö DG"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="w-full rounded-lg bg-emerald-600 text-white py-2.5 font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {loading
                    ? "Jobbar..."
                    : isLogin
                    ? "Logga in"
                    : showSignupDetails
                    ? "Skapa konto"
                    : "Fortsätt →"}
                </button>
              </form>

              <button
                className="mt-4 w-full text-center text-sm text-gray-700 hover:text-gray-900"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setShowSignupDetails(false);
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
