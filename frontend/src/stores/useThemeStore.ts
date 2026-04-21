import type { ThemeState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,

      toggleTheme: () => {
        const newValue = !get().isDark;
        set({ isDark: newValue });

        if (newValue) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },

      setTheme: (dark: boolean) => {
        set({ isDark: dark });
        if (dark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },
    }),
    {
      name: "theme-storage",
    },
  ),
);

// export const useThemeStore = create<ThemeState>()(
//   persist(
//     (set, get) => ({
//       isDark: false,

//       toggleTheme: () => {
//         const newvalue = !get().isDark;
//         set({ isDark: newvalue });
//         if (newvalue) {
//           document.documentElement.classList.add("dark");
//         } else {
//           document.documentElement.classList.remove("dark");
//         }
//       },
//       setTheme: (dark: boolean) => {
//         set({ isDark: dark });
//         if (dark) {
//           document.documentElement.classList.add("dark");
//         } else {
//           document.documentElement.classList.remove("dark");
//         }
//       },
//     }),
//     {
//       name: "theme-storage",
//     },
//   ),
// );
