import { create } from 'zustand';

type GameMode = 'menu' | 'single' | 'local_multi' | 'online_lobby' | 'online_multi';
type AnimalType = 'rat' | 'snake' | 'vulture' | 'eagle';

interface LocalPlayerSettings {
  animal: AnimalType;
}

interface GameState {
  hasSeenInstructions: boolean;
  setHasSeenInstructions: (seen: boolean) => void;
  
  mode: GameMode;
  setMode: (mode: GameMode) => void;

  roomId: string | null;
  setRoomId: (id: string | null) => void;
  
  playerAnimal: AnimalType;
  setPlayerAnimal: (animal: AnimalType) => void;

  spotifyToken: string | null;
  setSpotifyToken: (token: string | null) => void;

  spotifyTrackId: string | null;
  setSpotifyTrackId: (id: string | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  hasSeenInstructions: localStorage.getItem('hasSeenInstructions') === 'true',
  setHasSeenInstructions: (seen: boolean) => {
    localStorage.setItem('hasSeenInstructions', String(seen));
    set({ hasSeenInstructions: seen });
  },
  
  mode: 'menu',
  setMode: (mode) => set({ mode }),

  roomId: null,
  setRoomId: (id) => set({ roomId: id }),
  
  playerAnimal: 'snake',
  setPlayerAnimal: (animal) => set({ playerAnimal: animal }),

  spotifyToken: null,
  setSpotifyToken: (token) => set({ spotifyToken: token }),

  spotifyTrackId: null,
  setSpotifyTrackId: (id) => set({ spotifyTrackId: id })
}));
