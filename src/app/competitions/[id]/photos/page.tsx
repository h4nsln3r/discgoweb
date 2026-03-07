import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Database } from "@/types/supabase";
import { getCurrentUserWithAdmin } from "@/lib/auth-server";
import { SetTopbarActions } from "@/components/Topbar/TopbarActionsContext";
import CompetitionPhotosClient from "./CompetitionPhotosClient";

type PageProps = { params: Promise<{ id: string }> };

export default async function CompetitionPhotosPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: competition, error } = await supabase
    .from("competitions")
    .select("id, title, created_by")
    .eq("id", id)
    .single();

  if (!competition || error) {
    console.error("[FETCH COMPETITION ERROR]", error);
    notFound();
  }

  const { user } = await getCurrentUserWithAdmin(supabase);
  const isCreator = Boolean(
    competition.created_by && user?.id && competition.created_by === user.id
  );
  const { data: participant } = await supabase
    .from("competition_participants")
    .select("user_id")
    .eq("competition_id", id)
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const canUpload = Boolean(user && (isCreator || participant));

  return (
    <div>
      <SetTopbarActions
        backHref={`/competitions/${id}`}
        pageTitle={`${competition.title} – Bilder`}
      />
      <div className="w-full px-4 py-6 md:px-6 md:py-8 max-w-5xl mx-auto">
        <CompetitionPhotosClient
          competitionId={id}
          competitionTitle={competition.title}
          canUpload={canUpload}
        />
      </div>
    </div>
  );
}
