"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { initDB } from "./sqlite-init";

interface DbContextValue {
  ready: boolean;
  error: Error | null;
}

const DbContext = createContext<DbContextValue>({ ready: false, error: null });

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DbContextValue>({
    ready: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    initDB()
      .then(() => {
        if (!cancelled) setState({ ready: true, error: null });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ ready: false, error });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <DbContext.Provider value={state}>{children}</DbContext.Provider>;
}

export function useDatabaseStatus(): DbContextValue {
  return useContext(DbContext);
}
