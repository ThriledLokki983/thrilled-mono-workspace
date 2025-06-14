import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface AppState {
  route: {
    path?: string;
    title?: string;
  };
  title: string;
  isLoading: boolean;
  isFetching: boolean;
  matchingBreakpoints: string[];
}

interface AppStore extends AppState {
  setRoute: (route: { path?: string; title?: string }) => void;
  setTitle: (title: string) => void;
  setLoading: (loading: boolean) => void;
  setFetching: (fetching: boolean) => void;
  setBreakpoints: (breakpoints: string[]) => void;
  reset: () => void;
}

const initialState: AppState = {
  route: {},
  title: '',
  isLoading: false,
  isFetching: false,
  matchingBreakpoints: [],
};

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    setRoute: (route) =>
      set((state) => ({
        route: { ...state.route, ...route },
      })),

    setTitle: (title) => set({ title }),

    setLoading: (isLoading) => set({ isLoading }),

    setFetching: (isFetching) => set({ isFetching }),

    setBreakpoints: (matchingBreakpoints) => set({ matchingBreakpoints }),

    reset: () => set(initialState),
  }))
);
