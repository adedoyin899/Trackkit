"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AuthFlow } from "@/components/AuthFlow";
import { useTrackkitStore } from "@/lib/store";
import { ThemeToggle } from "@/components/ThemeToggle";

const noopSubscribe = () => () => {};

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-canvas)] p-4 sm:p-6 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <AuthFlow />
    </div>
  );
}
