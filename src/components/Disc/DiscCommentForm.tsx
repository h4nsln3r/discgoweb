"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { ArrowPathIcon, PhotoIcon, FilmIcon } from "@heroicons/react/24/outline";
import { uploadDiscCommentMedia, isCommentImageType, isCommentVideoType } from "@/lib/disc-uploads";
import { useToast } from "@/components/Toasts/ToastProvider";

export default function DiscCommentForm({ discId }: { discId: string }) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const { showToast } = useToast();
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Du måste vara inloggad för att kommentera.", "error");
      return;
    }
    if (!body.trim() && !file) {
      showToast("Skriv något eller ladda upp en bild/video.", "error");
      return;
    }

    setLoading(true);
    let mediaUrl: string | null = null;
    let mediaType: "image" | "video" | null = null;

    if (file) {
      const result = await uploadDiscCommentMedia(supabase, discId, file);
      if (!result) {
        showToast("Kunde inte ladda upp filen. Kontrollera att det är en bild eller video (mp4/webm).", "error");
        setLoading(false);
        return;
      }
      mediaUrl = result.url;
      mediaType = result.mediaType;
    }

    const { error } = await supabase.from("disc_comments").insert({
      disc_id: discId,
      user_id: user.id,
      body: body.trim() || null,
      media_type: mediaType,
      media_url: mediaUrl,
    });

    if (error) {
      showToast("Kunde inte spara kommentaren.", "error");
      setLoading(false);
      return;
    }

    showToast("Inlägg sparat!", "success");
    setBody("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setLoading(false);
    router.refresh();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    if (isCommentImageType(f.type) || isCommentVideoType(f.type)) {
      setFile(f);
    } else {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("Välj en bild (jpg, png, webp, gif) eller video (mp4, webm).", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Skriv en kommentar eller beskriv ditt kast..."
        rows={3}
        className="w-full rounded-xl border border-retro-border bg-retro-card text-stone-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500 resize-y min-h-[80px]"
      />
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
          onChange={onFileChange}
          className="hidden"
          aria-hidden
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-retro-border text-stone-400 hover:text-stone-200 hover:bg-retro-card text-sm"
        >
          <PhotoIcon className="w-4 h-4" />
          Bild
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-retro-border text-stone-400 hover:text-stone-200 hover:bg-retro-card text-sm"
        >
          <FilmIcon className="w-4 h-4" />
          Video
        </button>
        {file && (
          <span className="text-xs text-stone-500 truncate max-w-[180px]">
            {file.name}
          </span>
        )}
        <div className="flex-1" />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-retro-accent text-stone-100 text-sm font-medium hover:bg-retro-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="w-4 h-4 animate-spin" aria-hidden />
              Sparar...
            </>
          ) : (
            "Skicka"
          )}
        </button>
      </div>
    </form>
  );
}
