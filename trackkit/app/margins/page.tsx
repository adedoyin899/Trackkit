"use client";

import { useRouter } from "next/navigation";
import { ProfitabilityDashboard } from "@/components/ProfitabilityDashboard";

export default function MarginsPage() {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-24 pt-6 sm:px-6">
      <ProfitabilityDashboard onBack={() => router.push("/")} />
    </div>
  );
}
