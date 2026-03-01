"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadCompetitionImage } from "@/lib/competition-uploads";

/** 16:9 – visningsstorlek i crop-modalen (samma som lagbild). */
const CROP_DISPLAY_WIDTH = 400;
const CROP_DISPLAY_HEIGHT = 225;
const CROP_OUTPUT_WIDTH = 1200;
const CROP_OUTPUT_HEIGHT = 675;

type ImageMode = "url" | "upload";

type Props = {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  supabase: SupabaseClient;
  showToast: (msg: string, type: "error" | "success") => void;
  disabled?: boolean;
  /** Unikt för att undvika duplicerade id (t.ex. "new" eller "edit"). */
  idPrefix?: string;
  inputClass?: string;
};

export default function CompetitionImageField({
  imageUrl,
  onImageUrlChange,
  supabase,
  showToast,
  disabled = false,
  idPrefix = "competition",
  inputClass = "w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500",
}: Props) {
  const [imageMode, setImageMode] = useState<ImageMode>("url");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileToCrop, setFileToCrop] = useState<File | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropDrag, setCropDrag] = useState<{
    startX: number;
    startY: number;
    startOffset: { x: number; y: number };
  } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (fileToCrop) {
      const url = URL.createObjectURL(fileToCrop);
      setCropPreviewUrl(url);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
      return () => URL.revokeObjectURL(url);
    }
    setCropPreviewUrl(null);
  }, [fileToCrop]);

  const getCroppedFile = useCallback(async (): Promise<File | null> => {
    if (!fileToCrop || !imgRef.current) return null;
    const img = imgRef.current;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const zoom = Math.max(0.3, Math.min(2.5, cropZoom));
    const scale = Math.min(CROP_DISPLAY_WIDTH / nw, CROP_DISPLAY_HEIGHT / nh);
    const sw = CROP_DISPLAY_WIDTH / (zoom * scale);
    const sh = CROP_DISPLAY_HEIGHT / (zoom * scale);
    const sx = nw / 2 - cropOffset.x / scale - sw / 2;
    const sy = nh / 2 - cropOffset.y / scale - sh / 2;
    const canvas = document.createElement("canvas");
    canvas.width = CROP_OUTPUT_WIDTH;
    canvas.height = CROP_OUTPUT_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CROP_OUTPUT_WIDTH, CROP_OUTPUT_HEIGHT);
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const f = new File(
            [blob],
            fileToCrop.name.replace(/\.[^.]+$/, ".jpg") || "tavlingsbild.jpg",
            { type: "image/jpeg" }
          );
          resolve(f);
        },
        "image/jpeg",
        0.95
      );
    });
  }, [fileToCrop, cropZoom, cropOffset]);

  const handleCropConfirm = useCallback(async () => {
    const f = await getCroppedFile();
    if (!f) return;
    setFileToCrop(null);
    setCropPreviewUrl(null);
    setUploadingImage(true);
    const url = await uploadCompetitionImage(supabase, f);
    setUploadingImage(false);
    if (url) {
      onImageUrlChange(url);
    } else {
      showToast(
        "Kunde inte ladda upp bilden. Kontrollera att bucket \"competitions\" finns med rätt RLS-policies.",
        "error"
      );
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [getCroppedFile, supabase, onImageUrlChange, showToast]);

  const handleCropCancel = useCallback(() => {
    setFileToCrop(null);
    setCropPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setFileToCrop(file);
  };

  const clearImage = () => {
    onImageUrlChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (imageMode === "upload" && !imageUrl && fileToCrop === null) {
      setPreviewObjectUrl(null);
      return;
    }
    if (imageUrl) setPreviewObjectUrl(null);
  }, [imageMode, imageUrl, fileToCrop]);
  const previewSrc = imageUrl || previewObjectUrl;

  return (
    <div>
      <h2 className="font-semibold mb-2 text-stone-200">Tävlingsbild</h2>
      <p className="text-xs text-stone-500 mb-2">
        Du kan beskära till en rektangel (16:9) som lagbilden, så den passar i korten.
      </p>
      {(imageUrl || fileToCrop) && (
        <button
          type="button"
          onClick={fileToCrop ? handleCropCancel : clearImage}
          className="mb-2 text-sm text-stone-400 hover:text-amber-400 transition"
        >
          Ta bort bild
        </button>
      )}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setImageMode("url")}
          disabled={disabled}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
            imageMode === "url"
              ? "bg-retro-accent text-stone-100"
              : "bg-retro-card text-stone-400 hover:text-stone-200 border border-retro-border"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Bild från URL
        </button>
        <button
          type="button"
          onClick={() => setImageMode("upload")}
          disabled={disabled}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
            imageMode === "upload"
              ? "bg-retro-accent text-stone-100"
              : "bg-retro-card text-stone-400 hover:text-stone-200 border border-retro-border"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Ladda upp bild
        </button>
      </div>
      {imageMode === "url" ? (
        <div className="space-y-2">
          <input
            id={`${idPrefix}-image-url`}
            type="url"
            placeholder="https://..."
            value={typeof imageUrl === "string" ? imageUrl : ""}
            onChange={(e) => onImageUrlChange(e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            id={`${idPrefix}-image-file`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled || uploadingImage}
          />
          <label
            htmlFor={`${idPrefix}-image-file`}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-retro-border bg-retro-card text-stone-200 text-sm cursor-pointer transition ${
              disabled || uploadingImage ? "opacity-50 cursor-not-allowed" : "hover:bg-retro-surface"
            }`}
          >
            {uploadingImage ? "Laddar upp…" : "Välj bild (kan beskäras)"}
          </label>
        </div>
      )}
      {previewSrc && !fileToCrop && (
        <div className="mt-3">
          <p className="text-xs text-stone-400 mb-1">Förhandsgranskning</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt="Tävlingsbild"
            className="w-full max-h-48 object-cover rounded-lg border border-retro-border bg-retro-card"
          />
        </div>
      )}

      {/* Crop-modal 16:9 (samma som lagbild) */}
      {fileToCrop && cropPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-retro-surface border border-retro-border rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-retro-border">
              <h3 className="text-lg font-semibold text-stone-100">Beskär tävlingsbild</h3>
              <p className="text-sm text-stone-400 mt-1">
                Zooma och dra. Rektangeln (16:9) passar i tävlingskorten.
              </p>
            </div>
            <div className="p-4">
              <div
                className="mx-auto rounded-lg overflow-hidden bg-retro-card border-2 border-retro-border select-none touch-none"
                style={{ width: CROP_DISPLAY_WIDTH, height: CROP_DISPLAY_HEIGHT }}
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
                    alt="Beskär tävlingsbild"
                    className="max-w-none select-none"
                    style={{
                      width: CROP_DISPLAY_WIDTH,
                      height: CROP_DISPLAY_HEIGHT,
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
                disabled={uploadingImage}
                className="flex-1 py-2.5 rounded-xl bg-retro-accent text-stone-100 font-medium hover:bg-retro-accent-hover transition disabled:opacity-50"
              >
                {uploadingImage ? "Laddar upp…" : "Använd bild"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
