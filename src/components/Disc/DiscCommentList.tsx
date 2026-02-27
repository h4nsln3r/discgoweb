import Link from "next/link";

type CommentRow = {
  id: string;
  disc_id: string;
  user_id: string;
  body: string | null;
  media_type: "image" | "video" | null;
  media_url: string | null;
  created_at: string;
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function DiscCommentList({
  comments,
  authorMap,
}: {
  comments: CommentRow[];
  authorMap: Record<string, string>;
}) {
  if (comments.length === 0) {
    return (
      <p className="rounded-xl border border-retro-border bg-retro-surface p-6 text-center text-stone-500 text-sm">
        Inga inlägg än. Bli först med att kommentera eller dela en bild/video!
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <li
          key={c.id}
          className="rounded-xl border border-retro-border bg-retro-surface p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/profile/${c.user_id}`}
              className="font-medium text-stone-200 hover:text-retro-accent hover:underline"
            >
              {authorMap[c.user_id] ?? "—"}
            </Link>
            <span className="text-xs text-stone-500">
              {formatDate(c.created_at)}
            </span>
          </div>
          {c.body && (
            <p className="text-stone-300 text-sm whitespace-pre-wrap mb-2">
              {c.body}
            </p>
          )}
          {c.media_url && c.media_type === "image" && (
            <div className="mt-2 rounded-lg overflow-hidden max-w-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.media_url}
                alt="Bild i inlägg"
                className="w-full h-auto object-contain max-h-80"
              />
            </div>
          )}
          {c.media_url && c.media_type === "video" && (
            <div className="mt-2 rounded-lg overflow-hidden max-w-md">
              <video
                src={c.media_url}
                controls
                className="w-full max-h-80"
                preload="metadata"
              >
                Din webbläsare stöder inte videouppspelning.
              </video>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
