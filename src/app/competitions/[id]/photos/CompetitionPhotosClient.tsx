"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/components/Toasts/ToastProvider";

export type CompetitionPhoto = {
  id: string;
  image_url: string;
  created_at: string;
  uploaded_by: string;
};

const SLIDESHOW_INTERVAL_MS = 5000;

type TabId = "upload" | "gallery" | "slideshow";

const TABS: { id: TabId; label: string }[] = [
  { id: "upload", label: "Ladda upp" },
  { id: "gallery", label: "Galleri" },
  { id: "slideshow", label: "Bildspel" },
];

type Props = {
  competitionId: string;
  competitionTitle: string;
  canUpload: boolean;
};

export default function CompetitionPhotosClient({
  competitionId,
  competitionTitle,
  canUpload,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("gallery");
  const [photos, setPhotos] = useState<CompetitionPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const slideshowTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { showToast } = useToast();

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/photos`);
      if (!res.ok) throw new Error("Kunde inte hämta bilder");
      const data = await res.json();
      setPhotos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      showToast("Kunde inte hämta bilderna.", "error");
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [competitionId, showToast]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Lås scroll när bildspel är öppet
  useEffect(() => {
    if (slideshowOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [slideshowOpen]);

  // Bildspel: auto-advance
  useEffect(() => {
    if (!slideshowOpen || photos.length === 0) return;
    const id = setInterval(() => {
      setSlideDirection("next");
      setSlideshowIndex((i) => (i + 1) % photos.length);
    }, SLIDESHOW_INTERVAL_MS);
    slideshowTimerRef.current = id;
    return () => {
      if (slideshowTimerRef.current) clearInterval(slideshowTimerRef.current);
    };
  }, [slideshowOpen, photos.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!slideshowOpen || photos.length === 0) return;
      if (e.key === "Escape") setSlideshowOpen(false);
      if (e.key === "ArrowLeft") {
        setSlideDirection("prev");
        setSlideshowIndex((i) => (i - 1 + photos.length) % photos.length);
      }
      if (e.key === "ArrowRight") {
        setSlideDirection("next");
        setSlideshowIndex((i) => (i + 1) % photos.length);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [slideshowOpen, photos.length]);

  const slideshowPrev = useCallback(() => {
    setSlideDirection("prev");
    setSlideshowIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const slideshowNext = useCallback(() => {
    setSlideDirection("next");
    setSlideshowIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!canUpload || files.length === 0) return;
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (list.length === 0) {
        showToast("Välj bildfiler (t.ex. JPG, PNG).", "error");
        return;
      }
      setUploading(true);
      const formData = new FormData();
      list.forEach((f) => formData.append("files", f));
      try {
        const res = await fetch(`/api/competitions/${competitionId}/photos`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Något gick fel vid uppladdning.", "error");
          setUploading(false);
          return;
        }
        showToast(`${data.uploaded ?? 0} bilder uppladdade.`, "success");
        await fetchPhotos();
      } catch (e) {
        console.error(e);
        showToast("Kunde inte ladda upp bilderna.", "error");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
      }
    },
    [competitionId, canUpload, showToast, fetchPhotos]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (!canUpload || uploading) return;
      uploadFiles(e.dataTransfer.files);
    },
    [canUpload, uploading, uploadFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.length) uploadFiles(files);
    },
    [uploadFiles]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-stone-100">
        📷 Tävlingsbilder – {competitionTitle}
      </h1>

      {/* Tabbar */}
      <div
        className="flex border-b border-retro-border"
        role="tablist"
        aria-label="Sektionsflikar"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === id
                ? "border-retro-accent text-retro-accent"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Panel: Ladda upp */}
      <div
        id="panel-upload"
        role="tabpanel"
        aria-labelledby="tab-upload"
        hidden={activeTab !== "upload"}
        className="pt-2"
      >
        {canUpload ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-colors
              ${dragOver ? "border-retro-accent bg-retro-accent/10" : "border-retro-border bg-retro-surface"}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileInput}
              className="hidden"
              disabled={uploading}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInput}
              className="hidden"
              disabled={uploading}
            />
            <p className="text-stone-300 mb-4">
              Dra och släpp bilder här, eller välj nedan.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2.5 rounded-lg bg-retro-accent text-stone-100 font-medium hover:bg-retro-accent-hover disabled:opacity-50 transition"
              >
                {uploading ? "Laddar upp..." : "Välj från enhet"}
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2.5 rounded-lg border border-retro-border bg-retro-surface text-stone-200 font-medium hover:border-retro-accent hover:text-retro-accent disabled:opacity-50 transition"
              >
                📷 Ta foto
              </button>
            </div>
            <p className="text-stone-500 text-xs mt-3">
              På mobil kan &quot;Ta foto&quot; öppna kameran direkt.
            </p>
          </div>
        ) : (
          <p className="text-stone-400 text-sm">
            Logga in och gå med i tävlingen för att ladda upp bilder.
          </p>
        )}
      </div>

      {/* Panel: Galleri */}
      <div
        id="panel-gallery"
        role="tabpanel"
        aria-labelledby="tab-gallery"
        hidden={activeTab !== "gallery"}
        className="pt-2"
      >
        {loading && photos.length === 0 ? (
          <p className="text-stone-400">Laddar bilder...</p>
        ) : photos.length === 0 ? (
          <p className="text-stone-400">Inga bilder uppladdade än. Gå till fliken Ladda upp för att lägga till.</p>
        ) : (
          <div
            className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            role="list"
          >
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square rounded-lg overflow-hidden bg-retro-surface border border-retro-border hover:border-retro-accent transition focus:outline-none focus:ring-2 focus:ring-retro-accent"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.image_url}
                  alt="Tävlingsbild"
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Panel: Bildspel */}
      <div
        id="panel-slideshow"
        role="tabpanel"
        aria-labelledby="tab-slideshow"
        hidden={activeTab !== "slideshow"}
        className="pt-2"
      >
        {photos.length === 0 ? (
          <p className="text-stone-400">
            Inga bilder än. Ladda upp bilder under fliken Ladda upp, sedan kan du starta bildspelet här.
          </p>
        ) : (
          <div className="rounded-xl border border-retro-border bg-retro-surface p-6 text-center max-w-md mx-auto">
            <p className="text-stone-200 mb-4">
              Starta ett fullskärmsbildspel med {photos.length} {photos.length === 1 ? "bild" : "bilder"}.
            </p>
            <button
              type="button"
              onClick={() => {
                setSlideshowIndex(0);
                setSlideDirection(null);
                setSlideshowOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-retro-accent text-stone-100 font-medium hover:bg-retro-accent-hover transition focus:outline-none focus:ring-2 focus:ring-retro-accent"
            >
              ▶ Starta bildspel
            </button>
          </div>
        )}
      </div>

      {/* Fullskärmsbildspel */}
      {slideshowOpen && photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Bildspel"
        >
          <button
            type="button"
            onClick={() => setSlideshowOpen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-white/20 transition focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Stäng bildspel"
          >
            ✕
          </button>

          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 flex items-center justify-center">
            <button
              type="button"
              onClick={slideshowPrev}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-white/20 transition focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Föregående bild"
            >
              ‹
            </button>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 flex items-center justify-center">
            <button
              type="button"
              onClick={slideshowNext}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-white/20 transition focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Nästa bild"
            >
              ›
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-0">
            <div className="relative w-full h-full max-w-6xl flex items-center justify-center">
              {photos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out"
                  style={{
                    opacity: i === slideshowIndex ? 1 : 0,
                    transform:
                      i === slideshowIndex
                        ? "scale(1)"
                        : i < slideshowIndex
                          ? "scale(0.96)"
                          : "scale(1.04)",
                    pointerEvents: i === slideshowIndex ? "auto" : "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.image_url}
                    alt={`Tävlingsbild ${i + 1} av ${photos.length}`}
                    className="max-w-full max-h-full object-contain select-none"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 py-4 flex items-center justify-center gap-2">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSlideDirection(i > slideshowIndex ? "next" : "prev");
                  setSlideshowIndex(i);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === slideshowIndex
                    ? "bg-retro-accent scale-125"
                    : "bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Gå till bild ${i + 1}`}
              />
            ))}
          </div>
          <p className="text-center text-white/60 text-sm pb-2">
            {slideshowIndex + 1} / {photos.length}
          </p>
        </div>
      )}
    </div>
  );
}
