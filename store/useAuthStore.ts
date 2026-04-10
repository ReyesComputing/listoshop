import { create } from 'zustand';
import { Profile } from '../types/database';
import { supabase } from '../lib/supabase';

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  loading: true,
  setProfile: (profile) => set({ profile, loading: false }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ profile: null, loading: false });
  },
}));
