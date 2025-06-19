"use client";

export default function AddCoursePage() {
  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <h1 className="text-2xl font-bold mb-4">🥏 Lägg till resultat</h1>
        </div>
        <div className="w-full md:w-1/2">
          <h1 className="text-2xl font-bold mb-4">
            🥏 Senast tillagda resultat
          </h1>
        </div>
      </div>
    </main>
  );
}
