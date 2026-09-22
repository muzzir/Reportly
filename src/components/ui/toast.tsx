"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
}

export function ToastBanner({
  message,
  onClose,
}: {
  message: ToastMessage | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-start gap-3 rounded-lg border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 max-w-md ${
        message.type === "success"
          ? "border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100"
          : message.type === "error"
          ? "border-red-200 bg-red-50/95 text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100"
          : "border-slate-200 bg-white/95 text-slate-900 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {message.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        {message.type === "error" && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
        {message.type === "info" && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
      </div>
      <div className="flex-1 text-xs">
        <h4 className="font-semibold text-sm leading-tight">{message.title}</h4>
        {message.description && <p className="mt-1 leading-relaxed opacity-90">{message.description}</p>}
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
