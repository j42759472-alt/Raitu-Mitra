import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Language, Profile } from '../types';

type LatLng = { lat: number; lng: number };

export type TransportRoute = {
  pickup: LatLng;
  destination: LatLng;
  pickupAddress?: string;
  destinationAddress?: string;
  distanceKm: number;
};

interface AppState {
  user: Profile | null;
  isAuthenticated: boolean;
  phone: string;
  language: Language;
  hasHydrated: boolean;
  transportRoute: TransportRoute | null;
  setTransportRoute: (route: TransportRoute | null) => void;
  clearTransportRoute: () => void;
  setUser: (user: Profile | null) => void;
  setAuthenticated: (val: boolean) => void;
  setPhone: (phone: string) => void;
  setLanguage: (lang: Language) => void;
  setHasHydrated: (val: boolean) => void;
  logout: () => void;
}

type PersistedAppState = Pick<
  AppState,
  'user' | 'isAuthenticated' | 'phone' | 'language' | 'hasHydrated'
>;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      phone: '',
      language: 'en',
      hasHydrated: false,
      transportRoute: null,
      setTransportRoute: (route) => set({ transportRoute: route }),
      clearTransportRoute: () => set({ transportRoute: null }),
      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setPhone: (phone) => set({ phone }),
      setLanguage: (language) => set({ language }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          phone: '',
          language: get().language,
        }),
    }),
    {
      name: 'raitu-mitra-store',
      storage: createJSONStorage<PersistedAppState>(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        phone: state.phone,
        language: state.language,
        hasHydrated: true,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
