import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tab = "inventory" | "dashboard" | "settings";

interface MarketMateStore {
  shopName: string | null;
  currency: string;
  syncEnabled: boolean;

  currentTab: Tab;
  selectedProductId: string | null;

  setShopName: (name: string) => void;
  setCurrentTab: (tab: Tab) => void;
  setSelectedProductId: (id: string | null) => void;
}

export const useMarketMateStore = create<MarketMateStore>()(
  persist(
    (set) => ({
      shopName: null,
      currency: "₦",
      syncEnabled: false,

      currentTab: "dashboard",
      selectedProductId: null,

      setShopName: (name) => set({ shopName: name }),
      setCurrentTab: (tab) => set({ currentTab: tab }),
      setSelectedProductId: (id) => set({ selectedProductId: id }),
    }),
    {
      name: "marketmate-store",
      // selectedProductId is transient modal state — persisting it would
      // reopen a stale edit form on the next app launch.
      partialize: (state) => ({
        shopName: state.shopName,
        currency: state.currency,
        syncEnabled: state.syncEnabled,
        currentTab: state.currentTab,
      }),
    },
  ),
);
