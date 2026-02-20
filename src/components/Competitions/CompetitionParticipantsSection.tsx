import Link from "next/link";

export type ParticipantRow = {
  user_id: string;
  alias: string | null;
  avatar_url: string | null;
};

type Props = {
  participants: ParticipantRow[];
};

export default function CompetitionParticipantsSection({ participants }: Props) {
  if (participants.length === 0) {
    return (
      <div className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden">
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
    <div className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden">
      <h2 className="text-xl font-semibold px-4 py-3 border-b border-retro-border bg-retro-card text-stone-100">
        👥 Deltagare ({participants.length})
      </h2>
      <ul className="p-4 space-y-2">
        {participants.map((p) => (
          <li key={p.user_id}>
            <Link
              href={`/profile/${p.user_id}`}
              className="flex items-center gap-3 py-2 rounded-lg hover:bg-retro-card/50 transition"
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
          </li>
        ))}
      </ul>
    </div>
  );
}
