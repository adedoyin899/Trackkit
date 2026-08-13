"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { PurchaseHistoryDashboard } from "@/components/PurchaseHistoryDashboard";

export function PurchaseHistoryPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-6 sm:px-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 text-[13px] text-muted-gray hover:text-heading-charcoal"
      >
        <ArrowLeft size={14} /> Back
      </button>
      <PurchaseHistoryDashboard />
    </div>
  );
}
