import { create } from "zustand";
import { Match1X2 } from "../types/match";

type MatchesStore = {
  matches: Match1X2[];
  setMatches: (matches: Match1X2[]) => void;
  getMatch: (id: string) => Match1X2 | undefined;
};

export const useMatchesStore = create<MatchesStore>((set, get) => ({
  matches: [],
  setMatches: (matches) => set({ matches }),
  getMatch: (id) => get().matches.find((match) => match.id === id),
}));
