"use client";

import React from "react";
import { ToastProvider } from "./ui/ToastProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

