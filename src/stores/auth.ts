import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { upsertProfile } from '../services/db';
import type { Session } from '@supabase/supabase-js';

export type User = {
  id: string;
  name: string;
  email: string;
  photo?: string;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User) => void;
  setSession: (session: Session | null) => void;
  clearUser: () => Promise<void>;
  initialize: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  isLoading: true,

  setUser: (user) => set({ user }),

  setSession: (session) => set({ session }),

  clearUser: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({
          session,
          user: {
            id: session.user.id,
            name: session.user.user_metadata?.name || 'User',
            email: session.user.email || '',
            photo: session.user.user_metadata?.picture || undefined,
          },
        });
      }
    } catch (e) {
      console.warn('Supabase session restore failed:', e);
    } finally {
      set({ isLoading: false });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const name = session.user.user_metadata?.name || 'User';
        const email = session.user.email || '';
        const photo = session.user.user_metadata?.picture || undefined;
        set({
          session,
          user: { id: session.user.id, name, email, photo },
        });
        upsertProfile(session.user.id, name, email, photo);
      } else {
        set({ session: null, user: null });
      }
    });
  },
}));
