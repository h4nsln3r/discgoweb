"use client";

import { useState, useRef } from "react";

type TeamFormProps = {
  initialName?: string;
  initialOrt?: string;
  initialLogga?: string;
  initialAbout?: string;
  onSubmit: (data: {
    name: string;
    ort: string;
    logga: string;
    about: string;
  }) => Promise<void>;
  submitText: string;
};

export default function TeamForm({
  initialName = "",
  initialOrt = "",
  initialLogga = "",
  initialAbout = "",
  onSubmit,
  submitText,
}: TeamFormProps) {
  const [name, setName] = useState(initialName);
  const [ort, setOrt] = useState(initialOrt);
  const [logga, setLogga] = useState(initialLogga);
  const [about, setAbout] = useState(initialAbout);
  const [loading, setLoading] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const nameRef = useRef<HTMLDivElement>(null);

  const inputClass =
    "w-full rounded-xl border border-retro-border bg-retro-surface text-stone-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setInvalidFields(new Set(["name"]));
      nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setInvalidFields(new Set());
    setLoading(true);
    await onSubmit({ name: name.trim(), ort: ort.trim() || "", logga: logga.trim() || "", about: about.trim() || "" });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div ref={nameRef}>
        <label className="block text-sm font-medium text-stone-300 mb-1">Namn</label>
        <input
          className={invalidFields.has("name") ? `${inputClass} border-red-500 ring-2 ring-red-500/50` : inputClass}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setInvalidFields((p) => { const n = new Set(p); n.delete("name"); return n; });
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
      <div>
        <label className="block text-sm font-medium text-stone-300 mb-1">Logga (URL)</label>
        <input
          className={inputClass}
          value={logga}
          onChange={(e) => setLogga(e.target.value)}
          placeholder="https://..."
          type="url"
        />
        {logga && (
          <div className="mt-2 h-16 w-16 rounded-lg border border-retro-border overflow-hidden bg-retro-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logga} alt="Logga" className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
