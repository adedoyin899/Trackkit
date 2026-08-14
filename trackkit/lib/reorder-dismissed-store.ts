import { create } from "zustand";
import { persist } from "zustand/middleware";

const DISMISS_DAYS = 3;

interface ReorderDismissedStore {
  dismissedUntil: Record<string, string>; // productId -> ISO timestamp
  markOrdered: (productId: string) => void;
  isDismissed: (productId: string) => boolean;
}

/** "Mark as ordered" on a reorder recommendation snoozes it for a few days
 * rather than permanently — there's no supplier-ordering integration to
 * confirm against, so this is a lightweight "stop nagging me, I've
 * already handled it" rather than a real order-tracking system. */
export const useReorderDismissedStore = create<ReorderDismissedStore>()(
  persist(
    (set, get) => ({
      dismissedUntil: {},
      markOrdered: (productId) =>
        set((state) => ({
          dismissedUntil: {
            ...state.dismissedUntil,
            [productId]: new Date(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000).toISOString(),
          },
        })),
      isDismissed: (productId) => {
        const until = get().dismissedUntil[productId];
        return until != null && new Date(until).getTime() > Date.now();
      },
    }),
    { name: "trackkit-reorder-dismissed" },
  ),
);
