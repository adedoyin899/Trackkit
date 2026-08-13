"use client";

import { useSyncExternalStore } from "react";
import { WifiSlash } from "@phosphor-icons/react";
import {
  getOfflineStatusServerSnapshot,
  getOfflineStatusSnapshot,
  subscribeOfflineStatus,
} from "@/lib/offline-store";

export function OfflineIndicator() {
  const isOffline = useSyncExternalStore(
    subscribeOfflineStatus,
    getOfflineStatusSnapshot,
    getOfflineStatusServerSnapshot,
  );

  if (!isOffline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-[var(--color-ink-black)] px-4 py-2 text-[13px] font-medium text-white">
      <WifiSlash weight="bold" />
      Offline mode — everything you do here is saved on this device
    </div>
  );
}
