"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import BackButton from "@/components/Buttons/BackButton";
import DiscForm, { type DiscFormData } from "@/components/Forms/DiscForm";
import { useToast } from "@/components/Toasts/ToastProvider";
import { uploadDiscImage } from "@/lib/disc-uploads";

type DiscRow = {
  id: string;
  name: string;
  bild: string | null;
  disc_type: "driver" | "fairway" | "midrange" | "putter" | "other" | null;
  brand: string | null;
  speed: number | null;
  glide: number | null;
  turn: number | null;
  fade: number | null;
  created_by: string | null;
};

export default function EditDiscPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [disc, setDisc] = useState<DiscRow | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchDiscAndCheck = async () => {
      const [
        { data: { user } },
        currentUserRes,
        { data, error },
      ] = await Promise.all([
        supabase.auth.getUser(),
        fetch("/api/get-current-user").then((r) => (r.ok ? r.json() : null)),
        supabase.from("discs").select("id, name, bild, disc_type, brand, speed, glide, turn, fade, created_by").eq("id", id).single(),
      ]);

      if (!user) {
        router.push("/auth");
        setLoading(false);
        return;
      }

      if (error || !data) {
        showToast("Kunde inte hämta discen.", "error");
        setLoading(false);
        return;
      }

      const isAdmin = (currentUserRes as { is_admin?: boolean } | null)?.is_admin === true;
      setDisc(data as DiscRow);
      setCanEdit(data.created_by === user.id || isAdmin);
      setLoading(false);
    };

    fetchDiscAndCheck();
  }, [id, supabase, router, showToast]);

  const handleUpdate = async (data: DiscFormData) => {
    if (!id) return;

    let bildUrl: string | null = data.bild ?? disc?.bild ?? null;

    if (data.bildFile) {
      const uploaded = await uploadDiscImage(supabase, data.bildFile);
      if (uploaded) bildUrl = uploaded;
      else {
        showToast(
          "Kunde inte ladda upp bilden. Skapa bucket \"discs\" i Supabase Storage med public läsning.",
          "error"
        );
        return;
      }
    }

    const { error } = await supabase
      .from("discs")
      .update({
        name: data.name,
        bild: bildUrl,
        disc_type: data.disc_type ?? null,
        brand: data.brand ?? null,
        speed: data.speed ?? null,
        glide: data.glide ?? null,
        turn: data.turn ?? null,
        fade: data.fade ?? null,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      showToast("Kunde inte spara discen.", "error");
    } else {
      showToast("Discen har uppdaterats!", "success");
      router.push("/discs");
      router.refresh();
    }
  };

  if (loading) {
    return (
      <main className="p-4 sm:p-6 max-w-2xl mx-auto">
        <BackButton />
        <p className="text-stone-400 mt-4">Laddar...</p>
      </main>
    );
  }

  if (!disc) return null;
  if (!canEdit) {
    return (
      <main className="p-4 sm:p-6 max-w-2xl mx-auto">
        <BackButton />
        <p className="text-amber-400 mt-4">Du kan bara redigera discar som du själv har skapat.</p>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>
      <h1 className="text-2xl font-bold text-stone-100 mb-6">Redigera disc</h1>
      <DiscForm
        initialName={disc.name}
        initialDiscType={disc.disc_type ?? null}
        initialBrand={disc.brand ?? null}
        initialBild={disc.bild ?? ""}
        initialSpeed={disc.speed}
        initialGlide={disc.glide}
        initialTurn={disc.turn}
        initialFade={disc.fade}
        onSubmit={handleUpdate}
        submitText="Spara"
      />
    </main>
  );
}
