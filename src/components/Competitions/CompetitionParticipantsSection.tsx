import Link from "next/link";
import LeaveCompetitionButton from "./LeaveCompetitionButton";

export type ParticipantRow = {
  user_id: string;
  alias: string | null;
  avatar_url: string | null;
};

type Props = {
  id?: string;
  competitionId?: string;
  competitionTitle?: string;
  createdBy?: string | null;
  participants: ParticipantRow[];
  currentUserId?: string | null;
  justJoined?: boolean;
};

export default function CompetitionParticipantsSection({
  id: sectionId,
  competitionId,
  competitionTitle = "",
  createdBy,
  participants,
  currentUserId,
  justJoined,
}: Props) {
  if (participants.length === 0) {
    return (
      <div id={sectionId} className="scroll-mt-24 rounded-xl border border-retro-border bg-retro-surface overflow-hidden">
        <h2 className="text-xl font-semibold px-4 py-3 border-b border-retro-border bg-retro-card text-stone-100">
          👥 Deltagare
        </h2>
        <div className="p-4">
          <p className="text-stone-400 text-sm">Inga spelare har gått med än.</p>
        </div>
      </div>
    );
  }

  return (
    <div id={sectionId} className="scroll-mt-24 rounded-xl border border-retro-border bg-retro-surface overflow-hidden">
      <h2 className="text-xl font-semibold px-4 py-3 border-b border-retro-border bg-retro-card text-stone-100">
        👥 Deltagare ({participants.length})
      </h2>
      <ul className="p-4 space-y-2">
        {participants.map((p) => {
          const isJustJoined = Boolean(justJoined && currentUserId && p.user_id === currentUserId);
          const isCurrentUser = Boolean(currentUserId && p.user_id === currentUserId);
          const isCreator = Boolean(createdBy && p.user_id === createdBy);
          const canLeave = isCurrentUser && !isCreator && competitionId;
          return (
          <li
            key={p.user_id}
            className={`flex items-center justify-between gap-2 py-2 rounded-lg hover:bg-retro-card/50 transition ${isJustJoined ? "animate-participant-in" : ""}`}
          >
            <Link
              href={`/profile/${p.user_id}`}
              className="flex items-center gap-3 min-w-0 flex-1 py-1 rounded-lg hover:bg-retro-card/50 transition"
            >
              {p.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={p.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-retro-card flex items-center justify-center text-stone-500 shrink-0">
                  <span className="text-sm font-medium">
                    {(p.alias || "?")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <span className="font-medium text-stone-100 truncate">
                {p.alias || "Okänd spelare"}
              </span>
            </Link>
            {canLeave && (
              <LeaveCompetitionButton
                competitionId={competitionId}
                competitionTitle={competitionTitle}
              />
            )}
          </li>
          );
        })}
      </ul>
    </div>
  );
}
