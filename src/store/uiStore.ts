import { create } from 'zustand';

interface UIStore {
  confidenceThreshold: number;
  setConfidenceThreshold: (value: number) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  confidenceThreshold: 0.5,
  setConfidenceThreshold: (value) => set({ confidenceThreshold: value }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

