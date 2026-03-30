import { create } from 'zustand';
import { Profile } from '../types/database';

interface AuthState {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  signOut: () => set({ profile: null }),
}));
