"use client";

import { useState } from "react";

function ImageGallery({ images }: { images: string[] }) {
  const [selected, setSelected] = useState(images[0] ?? null);

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Main image */}
      {selected && (
        <img
          src={selected}
          alt="Vald bild"
          className="rounded w-full h-72 object-cover border"
        />
      )}

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pt-2">
        {images.map((img, idx) => (
          <button
            key={`${img}-${idx}`}
            type="button"
            onClick={() => setSelected(img)}
            className={`border rounded overflow-hidden ${
              img === selected
                ? "ring-2 ring-blue-500 border-blue-500"
                : "border-gray-300"
            }`}
          >
            <img
              src={img}
              alt={`thumbnail-${idx}`}
              className="w-24 h-16 object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default ImageGallery;
