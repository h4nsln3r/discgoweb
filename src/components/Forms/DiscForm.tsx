"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type DiscType = "driver" | "fairway" | "midrange" | "putter" | "other";

export type DiscFormData = {
  name: string;
  disc_type?: DiscType | null;
  bild?: string;
  bildFile?: File;
  speed?: number | null;
  glide?: number | null;
  turn?: number | null;
  fade?: number | null;
};

type DiscFormProps = {
  initialName?: string;
  initialDiscType?: DiscType | null;
  initialBild?: string;
  initialSpeed?: number | null;
  initialGlide?: number | null;
  initialTurn?: number | null;
  initialFade?: number | null;
  onSubmit: (data: DiscFormData) => Promise<void>;
  submitText: string;
};

const CROP_SIZE = 320;

const DISC_TYPE_OPTIONS: { value: DiscType; label: string }[] = [
  { value: "driver", label: "Driver" },
  { value: "fairway", label: "Fairway" },
  { value: "midrange", label: "Midrange" },
  { value: "putter", label: "Putter" },
  { value: "other", label: "Annan" },
];

export default function DiscForm({
  initialName = "",
  initialDiscType = null,
  initialBild = "",
  initialSpeed = null,
  initialGlide = null,
  initialTurn = null,
  initialFade = null,
  onSubmit,
  submitText,
}: DiscFormProps) {
  const [name, setName] = useState(initialName ?? "");
  const [discType, setDiscType] = useState<DiscType | "">(initialDiscType ?? "");
  const [bild, setBild] = useState(initialBild ?? "");
  const [bildFile, setBildFile] = useState<File | null>(null);
  const [imageMode, setImageMode] = useState<"url" | "upload">(initialBild ? "url" : "upload");
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  // Crop modal state
  const [cropOpen, setCropOpen] = useState(false);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropDrag, setCropDrag] = useState<{
    startX: number;
    startY: number;
    startOffset: { x: number; y: number };
  } | null>(null);
  const [cropError, setCropError] = useState<string | null>(null);

  // Flight stats
  const [speed, setSpeed] = useState<string>(initialSpeed != null ? String(initialSpeed) : "");
  const [glide, setGlide] = useState<string>(initialGlide != null ? String(initialGlide) : "");
  const [turn, setTurn] = useState<string>(initialTurn != null ? String(initialTurn) : "");
  const [fade, setFade] = useState<string>(initialFade != null ? String(initialFade) : "");

  const inputClass =
    "w-full rounded-xl border border-retro-border bg-retro-surface text-stone-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500";

  const bildPreview = useCallback(() => {
    if (bildFile) return URL.createObjectURL(bildFile);
    if (bild?.trim()) return bild.trim();
    return null;
  }, [bild, bildFile]);

  const preview = bildPreview();

  const openCropFromFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setCropPreviewUrl(url);
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setCropError(null);
    setCropOpen(true);
  }, []);

  const openCropFromUrl = useCallback((url: string) => {
    setCropPreviewUrl(url);
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setCropError(null);
    setCropOpen(true);
  }, []);

  useEffect(() => {
    if (!cropOpen || !cropPreviewUrl) return;
    return () => {
      if (cropPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(cropPreviewUrl);
    };
  }, [cropOpen, cropPreviewUrl]);

  const getCroppedFile = useCallback(async (): Promise<File | null> => {
    if (!cropPreviewUrl || !imgRef.current) return null;
    const img = imgRef.current;
    if (img.naturalWidth === 0 || img.naturalHeight === 0) return null;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const zoom = Math.max(0.3, Math.min(3, cropZoom));
    const scale = Math.min(CROP_SIZE / nw, CROP_SIZE / nh);
    const side = CROP_SIZE / (zoom * scale);
    const half = side / 2;
    const sx = nw / 2 - cropOffset.x / scale - half;
    const sy = nh / 2 - cropOffset.y / scale - half;
    const sw = side;
    const sh = side;
    const canvas = document.createElement("canvas");
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CROP_SIZE, CROP_SIZE);
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const f = new File([blob], "disc.jpg", { type: "image/jpeg" });
          resolve(f);
        },
        "image/jpeg",
        0.92
      );
    });
  }, [cropPreviewUrl, cropZoom, cropOffset]);

  const handleCropConfirm = useCallback(async () => {
    const f = await getCroppedFile();
    if (f) {
      setBildFile(f);
      setBild("");
      setImageMode("upload");
      setCropOpen(false);
      setCropPreviewUrl(null);
    } else {
      setCropError("Kunde inte beskära. Bilden kanske blockeras av CORS ( prova ladda upp fil istället).");
    }
  }, [getCroppedFile]);

  const handleCropCancel = useCallback(() => {
    setCropOpen(false);
    setCropPreviewUrl(null);
    setCropError(null);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      openCropFromFile(file);
    }
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setInvalidFields(new Set(["name"]));
      nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setInvalidFields(new Set());
    setLoading(true);
    const parseNum = (s: string): number | null => {
      if (s === "") return null;
      const n = parseInt(s, 10);
      return Number.isFinite(n) ? n : null;
    };
    const data: DiscFormData = {
      name: name.trim(),
      disc_type: discType && discType in { driver: 1, fairway: 1, midrange: 1, putter: 1, other: 1 } ? (discType as DiscType) : null,
      ...(imageMode === "url" && bild.trim() ? { bild: bild.trim() } : {}),
      ...(imageMode === "upload" && bildFile ? { bildFile } : {}),
      speed: parseNum(speed),
      glide: parseNum(glide),
      turn: parseNum(turn),
      fade: parseNum(fade),
    };
    await onSubmit(data);
    setLoading(false);
  };

  const handleModeChange = (mode: "url" | "upload") => {
    setImageMode(mode);
    if (mode === "url") setBildFile(null);
    else setBild("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div ref={nameRef}>
        <label className="block text-sm font-medium text-stone-300 mb-1">Namn</label>
        <input
          className={invalidFields.has("name") ? `${inputClass} border-red-500 ring-2 ring-red-500/50` : inputClass}
          value={name ?? ""}
          onChange={(e) => {
            setName(e.target.value);
            setInvalidFields((p) => {
              const n = new Set(p);
              n.delete("name");
              return n;
            });
          }}
          placeholder="t.ex. Destroyer"
          required
        />
      </div>

      {/* Disc-typ */}
      <div>
        <label className="block text-sm font-medium text-stone-300 mb-1">Typ av disc</label>
        <select
          className={inputClass}
          value={discType}
          onChange={(e) => setDiscType((e.target.value || "") as DiscType | "")}
        >
          <option value="">Välj typ (valfritt)</option>
          {DISC_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Bild med beskärning */}
      <div>
        <label className="block text-sm font-medium text-stone-300 mb-2">Bild</label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => handleModeChange("url")}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
              imageMode === "url"
                ? "bg-retro-accent text-stone-100"
                : "bg-retro-card text-stone-400 hover:text-stone-200"
            }`}
          >
            Bild-URL
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("upload")}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
              imageMode === "upload"
                ? "bg-retro-accent text-stone-100"
                : "bg-retro-card text-stone-400 hover:text-stone-200"
            }`}
          >
            Ladda upp bild
          </button>
        </div>

        {imageMode === "url" ? (
          <div key="url-mode" className="space-y-2">
            <input
              className={inputClass}
              value={bild ?? ""}
              onChange={(e) => setBild(e.target.value)}
              placeholder="https://..."
            />
            {bild.trim() && (
              <button
                type="button"
                onClick={() => openCropFromUrl(bild.trim())}
                className="text-sm text-retro-accent hover:underline"
              >
                Beskär till rund disc
              </button>
            )}
          </div>
        ) : (
          <div key="upload-mode" className="space-y-2">
            <input
              ref={fileInputRef}
              id="disc-bild-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              key="disc-file-input"
            />
            <label
              htmlFor="disc-bild-file"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-retro-border bg-retro-card text-stone-200 text-sm cursor-pointer hover:bg-retro-surface transition"
            >
              Välj bild (beskärs till rund)
            </label>
            {bildFile && (
              <button
                type="button"
                onClick={() => {
                  setBildFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="ml-2 text-sm text-stone-400 hover:text-stone-100"
              >
                Ta bort
              </button>
            )}
          </div>
        )}

        {preview && (
          <div className="mt-3 w-24 h-24 rounded-full overflow-hidden border border-retro-border bg-retro-card shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Förhandsvisning" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Crop modal */}
      {cropOpen && cropPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-retro-surface border border-retro-border rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-retro-border">
              <h3 className="text-lg font-semibold text-stone-100">Beskär till rund disc</h3>
              <p className="text-sm text-stone-400 mt-1">Zooma och dra för att placera. Cirkeln visar utsnittet.</p>
              {cropError && (
                <p className="text-sm text-amber-400 mt-2">{cropError}</p>
              )}
            </div>
            <div className="p-4">
              <div
                className="mx-auto rounded-full overflow-hidden bg-retro-card border-2 border-retro-border select-none touch-none"
                style={{ width: CROP_SIZE, height: CROP_SIZE }}
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  setCropDrag({ startX: e.clientX, startY: e.clientY, startOffset: { ...cropOffset } });
                }}
                onMouseMove={(e) => {
                  if (!cropDrag) return;
                  setCropOffset({
                    x: cropDrag.startOffset.x + (e.clientX - cropDrag.startX),
                    y: cropDrag.startOffset.y + (e.clientY - cropDrag.startY),
                  });
                }}
                onMouseUp={() => setCropDrag(null)}
                onMouseLeave={() => setCropDrag(null)}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  setCropDrag({ startX: t.clientX, startY: t.clientY, startOffset: { ...cropOffset } });
                }}
                onTouchMove={(e) => {
                  if (!cropDrag) return;
                  const t = e.touches[0];
                  setCropOffset({
                    x: cropDrag.startOffset.x + (t.clientX - cropDrag.startX),
                    y: cropDrag.startOffset.y + (t.clientY - cropDrag.startY),
                  });
                }}
                onTouchEnd={() => setCropDrag(null)}
              >
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    transform: `scale(${cropZoom}) translate(${cropOffset.x}px, ${cropOffset.y}px)`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={cropPreviewUrl}
                    alt="Beskär"
                    crossOrigin="anonymous"
                    className="max-w-none select-none"
                    style={{ width: CROP_SIZE, height: CROP_SIZE, objectFit: "contain" }}
                    draggable={false}
                    onError={() => setCropError("Kunde inte ladda bilden. Försök ladda upp fil istället.")}
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
                  value={cropZoom}
                  onChange={(e) => setCropZoom(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none bg-retro-card border border-retro-border accent-retro-accent"
                />
              </div>
            </div>
            <div className="p-4 flex gap-3 border-t border-retro-border">
              <button
                type="button"
                onClick={handleCropCancel}
                className="flex-1 py-2.5 rounded-xl border border-retro-border text-stone-200 hover:bg-retro-card transition"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                className="flex-1 py-2.5 rounded-xl bg-retro-accent text-stone-100 font-medium hover:bg-retro-accent-hover transition"
              >
                Använd bild
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flight numbers: Speed | Glide | Turn | Fade */}
      <div>
        <label className="block text-sm font-medium text-stone-300 mb-2">
          Flygnummer (Speed · Glide · Turn · Fade)
        </label>
        <p className="text-xs text-stone-500 mb-2">
          T.ex. 12 · 5 · -1 · 3. Valfritt.
        </p>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-stone-500 mb-0.5">Speed (1–14)</label>
            <input
              className={inputClass}
              type="number"
              min={1}
              max={14}
              value={speed ?? ""}
              onChange={(e) => setSpeed(e.target.value)}
              placeholder="—"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-0.5">Glide (1–7)</label>
            <input
              className={inputClass}
              type="number"
              min={1}
              max={7}
              value={glide ?? ""}
              onChange={(e) => setGlide(e.target.value)}
              placeholder="—"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-0.5">Turn (-5–1)</label>
            <input
              className={inputClass}
              type="number"
              min={-5}
              max={1}
              value={turn ?? ""}
              onChange={(e) => setTurn(e.target.value)}
              placeholder="—"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-0.5">Fade (0–5)</label>
            <input
              className={inputClass}
              type="number"
              min={0}
              max={5}
              value={fade ?? ""}
              onChange={(e) => setFade(e.target.value)}
              placeholder="—"
            />
          </div>
        </div>
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
