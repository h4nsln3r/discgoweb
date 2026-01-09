"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

type Course = { id: string; name: string };

export default function AuthPage() {
  const supabase = createSupabaseClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Sign up: extra profile fields (rullgardin) ---
  const [showSignupDetails, setShowSignupDetails] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [alias, setAlias] = useState("");
  const [phone, setPhone] = useState("+46 ");
  const [homeCourse, setHomeCourse] = useState<string>("");
  const [favoriteDisc, setFavoriteDisc] = useState("");
  const [city, setCity] = useState("");
  const [team, setTeam] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile]
  );

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    // reset details when toggling login/signup
    setError(null);
    if (isLogin) {
      setShowSignupDetails(false);
    }
  }, [isLogin]);

  useEffect(() => {
    const loadCourses = async () => {
      if (!showSignupDetails || isLogin) return;
      const { data, error } = await supabase
        .from("courses")
        .select("id, name")
        .order("name", { ascending: true });

      if (!error) setCourses((data as Course[]) ?? []);
    };

    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSignupDetails, isLogin]);

  async function uploadAvatar(userId: string) {
    if (!avatarFile) return null;

    // Put avatars under a stable path per user (overwrite is ok)
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const filePath = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl ?? null;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // STEP 1 (signup): first click expands the “rullgardin”
    if (!isLogin && !showSignupDetails) {
      setShowSignupDetails(true);
      return;
    }

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
      });
      if (error) throw error;

      // If e-mail confirmation is ON, session may be null here.
      if (!data.session) {
        // Store the extra fields locally so the user can finish after verifying.
        try {
          localStorage.setItem(
            `pending_profile:${email}`,
            JSON.stringify({
              alias,
              phone,
              homeCourse,
              favoriteDisc,
              city,
              team,
            })
          );
        } catch {
          // ignore
        }

        setError(
          "Konto skapat. Kolla din e-post och bekräfta kontot. När du sedan loggar in kan du slutföra profilen på profilsidan."
        );
        return;
      }

      // We have a session directly -> create profile now
      const userId = data.session.user.id;

      const avatarUrl = await uploadAvatar(userId);

      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: userId,
        alias: alias || email.split("@")[0],
        avatar_url: avatarUrl ?? "",
        home_course: homeCourse || null,
        phone: phone?.trim() || null,
        favorite_disc: favoriteDisc?.trim() || null,
        city: city?.trim() || null,
        team: team?.trim() || null,
      });

      if (upsertError) throw upsertError;

      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Något gick fel.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
                  className="w-full rounded-xl border border-gray-300 bg-white/70 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  type="email"
                  placeholder="namn@exempel.se"
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
                  className="w-full rounded-xl border border-gray-300 bg-white/70 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  type="password"
                  placeholder="Minst 6 tecken"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <AnimatePresence initial={false}>
                {!isLogin && showSignupDetails && (
                  <motion.div
                    key="signup-details"
                    initial={{ height: 0, opacity: 0, y: -6 }}
                    animate={{ height: "auto", opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-2xl border border-white/60 bg-white/55 p-4 shadow-sm space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-600/10 flex items-center justify-center">
                          <span className="text-emerald-700 font-semibold">
                            1
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">
                          Fyll i några profiluppgifter nu (du kan alltid ändra
                          senare).
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Name / Display name
                        </label>
                        <input
                          className="w-full rounded-xl border border-gray-300 bg-white/70 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Hannes, AceKing, ..."
                          value={alias}
                          onChange={(e) => setAlias(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Profilbild
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center">
                            {avatarPreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={avatarPreview}
                                alt="Preview"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-gray-500">
                                Valfri
                              </span>
                            )}
                          </div>

                          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white/70 cursor-pointer hover:bg-white transition">
                            <span className="text-sm text-gray-800">
                              Ladda upp
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                setAvatarFile(e.target.files?.[0] ?? null)
                              }
                            />
                          </label>

                          {avatarFile && (
                            <button
                              type="button"
                              onClick={() => setAvatarFile(null)}
                              className="text-sm text-gray-600 hover:text-gray-900"
                            >
                              Ta bort
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          Bilden sparas i Supabase Storage (bucket:{" "}
                          <span className="font-mono">avatars</span>).
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-800">
                            Hemmabana
                          </label>
                          <select
                            className="w-full rounded-xl border border-gray-300 bg-white/70 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={homeCourse}
                            onChange={(e) => setHomeCourse(e.target.value)}
                          >
                            <option value="">Välj bana (valfritt)</option>
                            {courses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-600">
                            Hittar du inte din bana? Skapa kontot först – du kan
                            lägga till en ny bana efteråt.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-800">
                            Favorit disc
                          </label>
                          <input
                            className="w-full rounded-xl border border-gray-300 bg-white/70 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="t.ex. Destroyer, Hex, ... (valfritt)"
                            value={favoriteDisc}
                            onChange={(e) => setFavoriteDisc(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-800">
                            Telefon
                          </label>
                          <input
                            className="w-full rounded-xl border border-gray-300 bg-white/70 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="+46 70 123 45 67"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            inputMode="tel"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-800">
                              Stad
                            </label>
                            <input
                              className="w-full rounded-xl border border-gray-300 bg-white/70 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="Malmö (valfritt)"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-800">
                              Lag
                            </label>
                            <input
                              className="w-full rounded-xl border border-gray-300 bg-white/70 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="Ditt lag (valfritt)"
                              value={team}
                              onChange={(e) => setTeam(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 text-white py-2.5 font-medium hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {loading
                  ? "Jobbar..."
                  : isLogin
                    ? "Logga in"
                    : showSignupDetails
                      ? "Skapa konto"
                      : "Skapa konto"}
              </button>

              {!isLogin && !showSignupDetails && (
                <motion.p
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-xs text-gray-700 text-center"
                >
                  Klicka <span className="font-semibold">Skapa konto</span> för
                  att fylla i profiluppgifter.
                </motion.p>
              )}
            </form>

            <button
              className="mt-4 w-full text-center text-sm text-gray-700 hover:text-gray-900"
              onClick={() => setIsLogin(!isLogin)}
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
  );
}
