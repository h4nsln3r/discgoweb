"use client";

import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import BackButton from "@/components/Buttons/BackButton";
import DiscForm from "@/components/Forms/DiscForm";
import { useToast } from "@/components/Toasts/ToastProvider";

export default function NewDiscPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { showToast } = useToast();

  const handleCreate = async (data: { name: string; bild: string }) => {
    const { error } = await supabase.from("discs").insert({
      name: data.name,
      bild: data.bild || null,
    });

    if (error) {
      console.error(error);
      showToast("Kunde inte skapa discen.", "error");
    } else {
      showToast("Discen har lagts till!", "success");
      router.push("/discs");
      router.refresh();
    }
  };

  return (
    <main className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>
      <h1 className="text-2xl font-bold text-stone-100 mb-6">Lägg till disc</h1>
      <DiscForm onSubmit={handleCreate} submitText="Skapa disc" />
    </main>
  );
}
