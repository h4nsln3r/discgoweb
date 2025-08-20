"use client";

import { useState } from "react";
import type { Course } from "../CourseList";
import Link from "next/link";
import AddScoreForm from "@/components/AddScoreForm";
import CourseScores from "@/components/CourseScores";
import { XMarkIcon } from "@heroicons/react/24/outline";

type Props = {
  course: Course | null;
  onClose: () => void;
};

export default function CoursePreviewPanel({ course, onClose }: Props) {
  const [openForm, setOpenForm] = useState(false);

  if (!course) return null;

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className="md:hidden fixed inset-0 z-50 bg-black/40"
        onClick={() => {
          setOpenForm(false);
          onClose();
        }}
      />

      {/* Panel container */}
      <div
        className="
          md:static md:z-auto md:w-auto
          fixed z-50 bottom-0 inset-x-0
          md:rounded-2xl
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl md:shadow-none p-4">
          {/* Mobile close */}
          <div className="flex justify-end md:hidden -mt-2 -mr-2">
            <button
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={() => {
                setOpenForm(false);
                onClose();
              }}
              aria-label="Stäng"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Card body (same vibe as CourseList.tsx) */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-semibold">{course.name}</h3>
            <p className="text-sm text-gray-600">{course.location}</p>

            {course.main_image_url && (
              <img
                src={course.main_image_url}
                alt={course.name}
                className="mt-2 rounded object-cover max-h-48 w-full"
              />
            )}

            {course.latitude && course.longitude && (
              <p className="text-xs text-gray-500 mt-1">
                📍 {course.latitude}, {course.longitude}
              </p>
            )}

            <Link
              href={`/courses/${course.id}`}
              className="text-sm text-blue-600 hover:underline mt-3 inline-block"
              onClick={() => {
                // Close when navigating on mobile for better UX
                setOpenForm(false);
                onClose();
              }}
            >
              Visa detaljer
            </Link>

            <div className="mt-4">
              <button
                onClick={() => setOpenForm((v) => !v)}
                className="text-sm text-blue-600 underline"
              >
                {openForm ? "Stäng formulär" : "Lägg till resultat"}
              </button>
            </div>

            {openForm && (
              <div className="mt-3">
                {/* Current AddScoreForm låter dig välja bana i dropdown */}
                <AddScoreForm onClose={() => setOpenForm(false)} />
              </div>
            )}

            <div className="mt-4">
              <CourseScores courseId={course.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
