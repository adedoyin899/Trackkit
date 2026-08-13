"use client";

import { useEffect, useState } from "react";
import { ArrowClockwise } from "@phosphor-icons/react";
import { applyServiceWorkerUpdate, registerServiceWorker } from "@/lib/service-worker";

export function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Registration is triggered from here (not app-wide in providers.tsx) so
  // the "new version ready" signal has somewhere to go the moment it fires.
  useEffect(() => {
    registerServiceWorker(() => setUpdateAvailable(true));
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="flex items-center justify-center gap-3 bg-[var(--color-link-blue)] px-4 py-2 text-[13px] font-medium text-white">
      A new version of MarketMate is ready.
      <button
        type="button"
        onClick={applyServiceWorkerUpdate}
        className="flex items-center gap-1 rounded-badges bg-white/20 px-2 py-1 font-semibold"
      >
        <ArrowClockwise weight="bold" /> Refresh
      </button>
    </div>
  );
}
