export default function CourseDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-pulse">
      <div className="h-5 w-32 rounded bg-retro-border/60" />

      {/* Bildgalleri-placeholder */}
      <div className="aspect-video w-full rounded-xl bg-retro-border/60" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vänster: karta + topp 3 */}
        <div className="space-y-4">
          <div className="aspect-[4/3] w-full rounded-xl bg-retro-border/60" />
          <div className="rounded-xl border border-retro-border bg-retro-surface p-4 space-y-2">
            <div className="h-5 w-40 rounded bg-retro-border/60" />
            <div className="h-4 w-full rounded bg-retro-border/50" />
            <div className="h-4 w-3/4 rounded bg-retro-border/50" />
            <div className="h-4 w-1/2 rounded bg-retro-border/50" />
          </div>
        </div>

        {/* Höger: titel, plats, beskrivning */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-9 w-64 rounded-lg bg-retro-border/60" />
            <div className="h-10 w-36 rounded-xl bg-retro-border/50" />
            <div className="h-5 w-24 rounded bg-retro-border/50" />
          </div>
          <div className="h-4 w-28 rounded bg-retro-border/50" />
          <div className="h-4 w-full rounded bg-retro-border/50" />
          <div className="border-t border-retro-border pt-4 space-y-2">
            <div className="h-5 w-32 rounded bg-retro-border/60" />
            <div className="h-4 w-full rounded bg-retro-border/50" />
            <div className="h-4 w-full rounded bg-retro-border/50" />
            <div className="h-4 w-2/3 rounded bg-retro-border/50" />
          </div>
        </div>
      </div>

      {/* Resultat-tabell placeholder */}
      <div>
        <div className="h-7 w-48 rounded bg-retro-border/60 mb-4" />
        <div className="rounded-xl border border-retro-border overflow-hidden">
          <div className="h-12 bg-retro-card" />
          <div className="h-12 border-t border-retro-border" />
          <div className="h-12 border-t border-retro-border" />
          <div className="h-12 border-t border-retro-border" />
        </div>
      </div>
    </div>
  );
}
