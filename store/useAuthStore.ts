import { create } from 'zustand';
import { Profile } from '../types/database';
import { supabase } from '../lib/supabase';

interface AuthState {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  signOut: async () => {
    // Fix Hallazgo 3: Complete logout: call Supabase signOut
    await supabase.auth.signOut();
    set({ profile: null });
  },
}));
