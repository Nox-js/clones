import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,

      toggle: () => {
        const next = !get().isDark;
        set({ isDark: next });
        applyTheme(next);
      },
    }),
    {
      name: 'tourney-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.isDark);
      },
    }
  )
);

export function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
}
