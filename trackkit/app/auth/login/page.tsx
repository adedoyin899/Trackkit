"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AuthFlow } from "@/components/AuthFlow";
import { useTrackkitStore } from "@/lib/store";

const noopSubscribe = () => () => {};

// Zustand's persisted `user` isn't available during SSR, so the first client
// render must match the server (null) before checking it — this detects
// "past hydration" without the setState-in-effect cascading-render pattern.
function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export default function LoginPage() {
  const router = useRouter();
  const user = useTrackkitStore((s) => s.user);
  const mounted = useMounted();

  useEffect(() => {
    if (mounted && user) {
      router.push("/");
    }
  }, [user, mounted, router]);

  // Prevent flashing of login screen if authenticated
  if (!mounted || user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-canvas p-4 sm:p-6">
      <AuthFlow />
    </div>
  );
}
