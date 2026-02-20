"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/** 16:9 rektangel så lagbilden passar i korten (aspect-video). */
const CROP_WIDTH = 400;
const CROP_HEIGHT = 225;

export type TeamFormData = {
  name: string;
  ort: string;
  logga: string;
  about: string;
  bild: string;
  loggaFile?: File;
  bildFile?: File;
};

type TeamFormProps = {
  initialName?: string;
  initialOrt?: string;
  initialLogga?: string;
  initialAbout?: string;
  initialBild?: string;
  onSubmit: (data: TeamFormData) => Promise<void>;
  submitText: string;
};

export default function TeamForm({
  initialName = "",
  initialOrt = "",
  initialLogga = "",
  initialAbout = "",
  initialBild = "",
  onSubmit,
  submitText,
}: TeamFormProps) {
  const [name, setName] = useState(initialName);
  const [ort, setOrt] = useState(initialOrt);
  const [logga, setLogga] = useState(initialLogga);
  const [loggaFile, setLoggaFile] = useState<File | null>(null);
  const [about, setAbout] = useState(initialAbout);
  const [bild, setBild] = useState(initialBild);
  const [bildFile, setBildFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const nameRef = useRef<HTMLDivElement>(null);

  const inputClass =
    "w-full rounded-xl border border-retro-border bg-retro-surface text-stone-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500";

  const [loggaPreviewUrl, setLoggaPreviewUrl] = useState<string | null>(null);
  const [bildPreviewUrl, setBildPreviewUrl] = useState<string | null>(null);

  const [fileToCropBild, setFileToCropBild] = useState<File | null>(null);
  const [cropPreviewUrlBild, setCropPreviewUrlBild] = useState<string | null>(null);
  const [cropZoomBild, setCropZoomBild] = useState(1);
  const [cropOffsetBild, setCropOffsetBild] = useState({ x: 0, y: 0 });
  const [cropDragBild, setCropDragBild] = useState<{ startX: number; startY: number; startOffset: { x: number; y: number } } | null>(null);
  const imgRefBild = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (loggaFile) {
      const url = URL.createObjectURL(loggaFile);
      setLoggaPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setLoggaPreviewUrl(logga || null);
  }, [loggaFile, logga]);

  useEffect(() => {
    if (bildFile) {
      const url = URL.createObjectURL(bildFile);
      setBildPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setBildPreviewUrl(bild || null);
  }, [bildFile, bild]);

  useEffect(() => {
    if (!fileToCropBild) return;
    const url = URL.createObjectURL(fileToCropBild);
    setCropPreviewUrlBild(url);
    setCropZoomBild(1);
    setCropOffsetBild({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [fileToCropBild]);

  const getCroppedFileBild = useCallback(async (): Promise<File | null> => {
    if (!fileToCropBild || !imgRefBild.current) return null;
    const img = imgRefBild.current;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const zoom = Math.max(0.3, Math.min(3, cropZoomBild));
    const scale = Math.min(CROP_WIDTH / nw, CROP_HEIGHT / nh);
    const sw = CROP_WIDTH / (zoom * scale);
    const sh = CROP_HEIGHT / (zoom * scale);
    const sx = nw / 2 - cropOffsetBild.x / scale - sw / 2;
    const sy = nh / 2 - cropOffsetBild.y / scale - sh / 2;
    const canvas = document.createElement("canvas");
    canvas.width = CROP_WIDTH;
    canvas.height = CROP_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CROP_WIDTH, CROP_HEIGHT);
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const f = new File([blob], fileToCropBild.name.replace(/\.[^.]+$/, ".jpg") || "lagbild.jpg", { type: "image/jpeg" });
          resolve(f);
        },
        "image/jpeg",
        0.92
      );
    });
  }, [fileToCropBild, cropZoomBild, cropOffsetBild]);

  const handleBildCropConfirm = useCallback(async () => {
    const f = await getCroppedFileBild();
    if (f) {
      setBildFile(f);
      setFileToCropBild(null);
      setCropPreviewUrlBild(null);
      setBild("");
    }
  }, [getCroppedFileBild]);

  const handleBildCropCancel = useCallback(() => {
    setFileToCropBild(null);
    setCropPreviewUrlBild(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setInvalidFields(new Set(["name"]));
      nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setInvalidFields(new Set());
    setLoading(true);
    await onSubmit({
      name: name.trim(),
      ort: ort.trim() || "",
      logga: logga.trim() || "",
      about: about.trim() || "",
      bild: bild.trim() || "",
      loggaFile: loggaFile ?? undefined,
      bildFile: bildFile ?? undefined,
    });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Crop-modal för lagbild (16:9 rektangel) */}
      {fileToCropBild && cropPreviewUrlBild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-retro-surface border border-retro-border rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-retro-border">
              <h3 className="text-lg font-semibold text-stone-100">Beskär lagbild</h3>
              <p className="text-sm text-stone-400 mt-1">Zooma och dra. Rektangeln (16:9) passar i lagkorten.</p>
            </div>
            <div className="p-4">
              <div
                className="mx-auto rounded-lg overflow-hidden bg-retro-card border-2 border-retro-border select-none touch-none"
                style={{ width: CROP_WIDTH, height: CROP_HEIGHT }}
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  setCropDragBild({ startX: e.clientX, startY: e.clientY, startOffset: { ...cropOffsetBild } });
                }}
                onMouseMove={(e) => {
                  if (!cropDragBild) return;
                  setCropOffsetBild({
                    x: cropDragBild.startOffset.x + (e.clientX - cropDragBild.startX),
                    y: cropDragBild.startOffset.y + (e.clientY - cropDragBild.startY),
                  });
                }}
                onMouseUp={() => setCropDragBild(null)}
                onMouseLeave={() => setCropDragBild(null)}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  setCropDragBild({ startX: t.clientX, startY: t.clientY, startOffset: { ...cropOffsetBild } });
                }}
                onTouchMove={(e) => {
                  if (!cropDragBild) return;
                  const t = e.touches[0];
                  setCropOffsetBild({
                    x: cropDragBild.startOffset.x + (t.clientX - cropDragBild.startX),
                    y: cropDragBild.startOffset.y + (t.clientY - cropDragBild.startY),
                  });
                }}
                onTouchEnd={() => setCropDragBild(null)}
              >
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    transform: `scale(${cropZoomBild}) translate(${cropOffsetBild.x}px, ${cropOffsetBild.y}px)`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRefBild}
                    src={cropPreviewUrlBild}
                    alt="Beskär lagbild"
                    className="max-w-none select-none"
                    style={{
                      width: CROP_WIDTH,
                      height: CROP_HEIGHT,
                      objectFit: "contain",
                    }}
                    draggable={false}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm text-stone-400 mb-1">Zoom</label>
                <input
                  type="range"
                  min={0.3}
                  max={2.5}
                  step={0.05}
                  value={cropZoomBild}
                  onChange={(e) => setCropZoomBild(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none bg-retro-card border border-retro-border accent-retro-accent"
                />
              </div>
            </div>
            <div className="p-4 flex gap-3 border-t border-retro-border">
              <button
                type="button"
                onClick={handleBildCropCancel}
                className="flex-1 py-2.5 rounded-xl border border-retro-border text-stone-200 hover:bg-retro-card transition"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleBildCropConfirm}
                className="flex-1 py-2.5 rounded-xl bg-retro-accent text-stone-100 font-medium hover:bg-retro-accent-hover transition"
              >
                Använd bild
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={nameRef}>
        <label className="block text-sm font-medium text-stone-300 mb-1">Namn</label>
        <input
          className={invalidFields.has("name") ? `${inputClass} border-red-500 ring-2 ring-red-500/50` : inputClass}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setInvalidFields((p) => {
              const n = new Set(p);
              n.delete("name");
              return n;
            });
          }}
          placeholder="t.ex. Discgolfklubben"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-300 mb-1">Ort</label>
        <input
          className={inputClass}
          value={ort}
          onChange={(e) => setOrt(e.target.value)}
          placeholder="t.ex. Stockholm"
        />
      </div>

      {/* Logga: uppladdning eller URL – används som ikon och full logga */}
      <div>
        <label className="block text-sm font-medium text-stone-300 mb-1">Logga</label>
        <p className="text-xs text-stone-500 mb-2">Används som ikon (t.ex. i profil) och som full logga. Ladda upp eller klistra in URL.</p>
        <div className="flex flex-wrap gap-4 items-start">
          <label className="cursor-pointer rounded-xl border border-retro-border bg-retro-card px-3 py-2 text-sm text-stone-300 hover:bg-retro-border/30 transition">
            Välj fil
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setLoggaFile(f ?? null);
                if (f) setLogga("");
                e.target.value = "";
              }}
            />
          </label>
          <input
            className={`${inputClass} flex-1 min-w-0`}
            value={logga}
            onChange={(e) => {
              setLogga(e.target.value);
              if (e.target.value.trim()) setLoggaFile(null);
            }}
            placeholder="eller klistra in bild-URL"
            type="url"
          />
        </div>
        {(loggaPreviewUrl !== null || logga) && (
          <div className="mt-3 flex items-center gap-4 flex-wrap">
            <span className="text-xs text-stone-500">Som ikon:</span>
            <div className="h-12 w-12 rounded-full border border-retro-border overflow-hidden bg-retro-card flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={loggaPreviewUrl ?? logga}
                alt="Logga ikon"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <span className="text-xs text-stone-500">Full logga:</span>
            <div className="h-20 w-20 rounded-lg border border-retro-border overflow-hidden bg-retro-card shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={loggaPreviewUrl ?? logga}
                alt="Logga"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lagbild – rektangulär beskärning 16:9 */}
      <div>
        <label className="block text-sm font-medium text-stone-300 mb-1">Lagbild</label>
        <p className="text-xs text-stone-500 mb-2">En bild som representerar laget. Du kan beskära till en rektangel (16:9) så den passar i korten.</p>
        <div className="flex flex-wrap gap-4 items-start">
          <label className="cursor-pointer rounded-xl border border-retro-border bg-retro-card px-3 py-2 text-sm text-stone-300 hover:bg-retro-border/30 transition">
            Välj fil
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && f.type.startsWith("image/")) setFileToCropBild(f);
                e.target.value = "";
              }}
            />
          </label>
          <input
            className={`${inputClass} flex-1 min-w-0`}
            value={bild}
            onChange={(e) => {
              setBild(e.target.value);
              if (e.target.value.trim()) setBildFile(null);
            }}
            placeholder="eller klistra in bild-URL"
            type="url"
          />
        </div>
        {(bildPreviewUrl !== null || bild) && (
          <div className="mt-3 aspect-video max-h-40 w-full max-w-md rounded-lg border border-retro-border overflow-hidden bg-retro-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bildPreviewUrl ?? bild}
              alt="Lagbild"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-300 mb-1">Om laget</label>
        <textarea
          className={inputClass}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Kort beskrivning..."
          rows={4}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-retro-accent text-stone-100 py-2.5 font-medium hover:bg-retro-accent-hover transition disabled:opacity-50"
      >
        {loading ? "Sparar..." : submitText}
      </button>
    </form>
  );
}
