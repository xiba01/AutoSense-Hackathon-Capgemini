import { create } from "zustand";

export const useAIUXStore = create((set) => ({
  uxMode: "guided",

  currentIntent: null,
  setIntent: (intent) => {
    set({ currentIntent: intent });
  },

  setUXMode: (mode) => {
    set({ uxMode: mode });
  },

  clearIntent: () => {
    set({ currentIntent: null });
  },
}));
