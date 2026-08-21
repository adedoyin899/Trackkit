import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tab = "inventory" | "dashboard" | "settings" | "margins" | "history" | "trends" | "ai";

export interface User {
  id: string;
  phoneNumber: string | null;
  email?: string | null;
  shopName: string | null;
  traderName?: string | null;
  marketLocation?: string | null;
  category?: string | null;
  createdAt: string;
}

interface TrackkitStore {
  shopName: string | null;
  traderName: string | null;
  marketLocation: string | null;
  category: string | null;
  currency: string;
  targetMarginGoal: number;
  defaultLowStockThreshold: number;
  hasCompletedOnboarding: boolean;
  syncEnabled: boolean;
  user: User | null;

  currentTab: Tab;
  selectedProductId: string | null;

  setShopName: (name: string) => void;
  setTraderName: (name: string) => void;
  setMarketLocation: (location: string) => void;
  setCategory: (category: string) => void;
  setCurrency: (currency: string) => void;
  setTargetMarginGoal: (goal: number) => void;
  setDefaultLowStockThreshold: (threshold: number) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setCurrentTab: (tab: Tab) => void;
  setSelectedProductId: (id: string | null) => void;
  setUser: (user: User | null) => void;
}

export const useTrackkitStore = create<TrackkitStore>()(
  persist(
    (set) => ({
      shopName: null,
      traderName: null,
      marketLocation: null,
      category: null,
      currency: "₦",
      targetMarginGoal: 20,
      defaultLowStockThreshold: 5,
      hasCompletedOnboarding: false,
      syncEnabled: false,
      user: null,

      currentTab: "dashboard",
      selectedProductId: null,

      setShopName: (name) => set({ shopName: name }),
      setTraderName: (name) => set({ traderName: name }),
      setMarketLocation: (location) => set({ marketLocation: location }),
      setCategory: (category) => set({ category }),
      setCurrency: (currency) => set({ currency }),
      setTargetMarginGoal: (goal) => set({ targetMarginGoal: goal }),
      setDefaultLowStockThreshold: (threshold) => set({ defaultLowStockThreshold: threshold }),
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
      setCurrentTab: (tab) => set({ currentTab: tab }),
      setSelectedProductId: (id) => set({ selectedProductId: id }),
      setUser: (user) => set({ user }),
    }),
    {
      name: "trackkit-store",
      // selectedProductId is transient modal state — persisting it would
      // reopen a stale edit form on the next app launch.
      partialize: (state) => ({
        shopName: state.shopName,
        traderName: state.traderName,
        marketLocation: state.marketLocation,
        category: state.category,
        currency: state.currency,
        targetMarginGoal: state.targetMarginGoal,
        defaultLowStockThreshold: state.defaultLowStockThreshold,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        syncEnabled: state.syncEnabled,
        currentTab: state.currentTab,
        user: state.user,
      }),
    },
  ),
);
