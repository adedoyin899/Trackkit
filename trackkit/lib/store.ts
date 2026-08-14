import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tab = "inventory" | "dashboard" | "settings" | "margins" | "history";

export interface User {
  id: string;
  phoneNumber: string | null;
  email?: string | null;
  shopName: string | null;
  createdAt: string;
}

interface TrackkitStore {
  shopName: string | null;
  currency: string;
  syncEnabled: boolean;
  user: User | null;

  currentTab: Tab;
  selectedProductId: string | null;

  setShopName: (name: string) => void;
  setCurrentTab: (tab: Tab) => void;
  setSelectedProductId: (id: string | null) => void;
  setUser: (user: User | null) => void;
}

export const useTrackkitStore = create<TrackkitStore>()(
  persist(
    (set) => ({
      shopName: null,
      currency: "₦",
      syncEnabled: false,
      user: null,

      currentTab: "dashboard",
      selectedProductId: null,

      setShopName: (name) => set({ shopName: name }),
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
        currency: state.currency,
        syncEnabled: state.syncEnabled,
        currentTab: state.currentTab,
        user: state.user,
      }),
    },
  ),
);
