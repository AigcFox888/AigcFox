import { create } from "zustand";

import type { ThemeMode } from "@/features/preferences/preferences-types";

interface ThemePreferenceState {
  setThemeMode: (themeMode: ThemeMode) => void;
  themeMode: ThemeMode;
}

export const useThemePreferenceStore = create<ThemePreferenceState>((set) => ({
  setThemeMode: (themeMode) => {
    set({ themeMode });
  },
  themeMode: "system",
}));
