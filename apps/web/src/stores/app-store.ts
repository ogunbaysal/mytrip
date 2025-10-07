import { create } from "zustand";

export type ThemePreference = "light" | "dark" | "system";

export const STAY_TYPES = ["all", "stay", "experience", "restaurant"] as const;
export type StayType = (typeof STAY_TYPES)[number];

export type SearchFilters = {
  location: string;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  stayType: StayType;
};

type AppState = {
  theme: ThemePreference;
  searchFilters: SearchFilters;
  favoriteIds: string[];
};

type AppActions = {
  setTheme: (theme: ThemePreference) => void;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  resetSearchFilters: () => void;
  toggleFavorite: (id: string) => void;
};

const initialFilters: SearchFilters = {
  location: "",
  checkIn: null,
  checkOut: null,
  guests: 2,
  stayType: "all",
};

export const useAppStore = create<AppState & AppActions>()((set) => ({
  theme: "system",
  searchFilters: initialFilters,
  favoriteIds: [],
  setTheme: (theme) => set({ theme }),
  setSearchFilters: (filters) =>
    set(({ searchFilters }) => ({
      searchFilters: { ...searchFilters, ...filters },
    })),
  resetSearchFilters: () => set({ searchFilters: initialFilters }),
  toggleFavorite: (id) =>
    set((state) => {
      const exists = state.favoriteIds.includes(id);
      return {
        favoriteIds: exists
          ? state.favoriteIds.filter((item) => item !== id)
          : [...state.favoriteIds, id],
      };
    }),
}));

export const selectSearchFilters = () =>
  useAppStore.getState().searchFilters;
