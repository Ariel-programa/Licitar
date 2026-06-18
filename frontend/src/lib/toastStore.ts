import { create } from "zustand";

let nextId = 0;

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastStore {
  toasts: Toast[];
  show: (message: string, type?: Toast["type"]) => void;
  remove: (id: number) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (message, type = "success") => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      3500,
    );
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (msg: string) => useToastStore.getState().show(msg, "success"),
  error: (msg: string) => useToastStore.getState().show(msg, "error"),
  info: (msg: string) => useToastStore.getState().show(msg, "info"),
};
