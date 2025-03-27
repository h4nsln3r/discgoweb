// app/auth/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

export default function AuthPage() {
  const supabase = createSupabaseClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setError("");
    let result;

    if (isLogin) {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">
        {isLogin ? "Logga in" : "Skapa konto"}
      </h1>

      <input
        className="border p-2 mb-2 w-64"
        type="email"
        placeholder="E-post"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2 mb-4 w-64"
        type="password"
        placeholder="Lösenord"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleAuth}
      >
        {isLogin ? "Logga in" : "Skapa konto"}
      </button>

      <button
        className="mt-4 text-sm text-gray-600"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin
          ? "Har du inget konto? Skapa ett →"
          : "Redan medlem? Logga in →"}
      </button>
    </div>
  );
}
