"use client";

import { useState } from "react";

function ImageGallery({ images }: { images: string[] }) {
  const validImages = (images ?? []).filter(
    (url) => typeof url === "string" && url.trim() !== ""
  );
  const [selected, setSelected] = useState(validImages[0] ?? null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (validImages.length === 0) return null;

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="space-y-4">
      {/* Main image */}
      {selected && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={selected}
          alt="Vald bild"
          className="rounded w-full h-72 object-cover border cursor-pointer"
          onClick={openModal}
        />
      )}

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pt-2">
        {validImages.map((img, idx) => (
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={`thumbnail-${idx}`}
              className="w-24 h-16 object-cover"
            />
          </button>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && selected && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected}
              alt="Full screen"
              className="max-h-full max-w-full object-contain cursor-zoom-in"
            />
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 text-black font-bold shadow"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
