import { create } from "zustand";
import { useState, useEffect } from "react";

export interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
  exiting?: boolean;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: Toast["type"], message: string) => void;
  removeToast: (id: number) => void;
}

let nextId = 0;
const MAX_TOASTS = 3;
const DISPLAY_MS = 3000;
const EXIT_MS = 300;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = nextId++;
    set((s) => {
      const trimmed = s.toasts.length >= MAX_TOASTS ? s.toasts.slice(-MAX_TOASTS + 1) : s.toasts;
      return { toasts: [...trimmed, { id, type, message }] };
    });
    setTimeout(() => {
      set((s) => ({
        toasts: s.toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      }));
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, EXIT_MS);
    }, DISPLAY_MS);
  },
  removeToast: (id) => {
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, EXIT_MS);
  },
}));

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const isExiting = toast.exiting;

  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  };

  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  return (
    <div
      className={`pointer-events-auto rounded-lg shadow-lg px-4 py-3 text-sm font-medium flex items-center gap-2 text-white transition-all duration-300 ease-out ${
        colors[toast.type]
      } ${visible && !isExiting ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}
    >
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs shrink-0">
        {icons[toast.type]}
      </span>
      <span className="flex-1">{toast.message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 shrink-0 text-lg leading-none">
        ×
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

export function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  return {
    success: (msg: string) => addToast("success", msg),
    error: (msg: string) => addToast("error", msg),
    info: (msg: string) => addToast("info", msg),
  };
}
