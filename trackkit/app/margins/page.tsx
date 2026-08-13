"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { ProfitabilityDashboard } from "@/components/ProfitabilityDashboard";

export default function MarginsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Guard redirection until hydration is complete on the client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Client-side authentication gate
  useEffect(() => {
    if (mounted && !user) {
      router.push("/auth/login");
    }
  }, [user, mounted, router]);

  // Prevent flicker before redirecting
  if (!mounted || !user) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-24 pt-6 sm:px-6">
      <ProfitabilityDashboard onBack={() => router.push("/")} />
    </div>
  );
}
