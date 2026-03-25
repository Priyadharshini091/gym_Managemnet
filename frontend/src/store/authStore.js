import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      member: null,
      setSession: (payload) =>
        set({
          token: payload.access_token,
          user: payload.user,
          member: payload.member,
        }),
      logout: () =>
        set({
          token: null,
          user: null,
          member: null,
        }),
    }),
    {
      name: 'gymflow-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
