"use client";

import { useState, useRef } from "react";

type DiscFormProps = {
  initialName?: string;
  initialBild?: string;
  onSubmit: (data: { name: string; bild: string }) => Promise<void>;
  submitText: string;
};

export default function DiscForm({
  initialName = "",
  initialBild = "",
  onSubmit,
  submitText,
}: DiscFormProps) {
  const [name, setName] = useState(initialName);
  const [bild, setBild] = useState(initialBild);
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

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
    await onSubmit({ name: name.trim(), bild: bild.trim() || "" });
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
      <div>
        <label className="block text-sm font-medium text-stone-300 mb-1">Bild (URL)</label>
        <input
          className={inputClass}
          value={bild}
          onChange={(e) => setBild(e.target.value)}
          placeholder="https://..."
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
