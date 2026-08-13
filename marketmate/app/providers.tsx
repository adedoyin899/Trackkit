"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IconContext } from "@phosphor-icons/react";
import { DatabaseProvider } from "@/lib/db-context";

// "Bold" weight everywhere — matches the spec's "large, high-contrast" UI
// requirement (PHASE-1-MVP.md) for a low-tech-literacy, small-screen audience.
const iconDefaults = { size: 20, weight: "bold" as const };

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <IconContext.Provider value={iconDefaults}>
        <DatabaseProvider>{children}</DatabaseProvider>
      </IconContext.Provider>
    </QueryClientProvider>
  );
}
