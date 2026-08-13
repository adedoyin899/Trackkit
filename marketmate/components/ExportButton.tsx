"use client";

import { DownloadSimple } from "@phosphor-icons/react";
import { useLocalInventory } from "@/hooks/useLocalInventory";
import { useTransactions } from "@/hooks/useTransactions";
import { useMarketMateStore } from "@/lib/store";
import { buildInventoryCsv, downloadCsv } from "@/lib/csv-export";

export function ExportButton() {
  const { products } = useLocalInventory();
  const { transactions } = useTransactions();
  const shopName = useMarketMateStore((s) => s.shopName);

  const handleExport = () => {
    const csv = buildInventoryCsv(products, transactions, shopName);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `marketmate-export-${date}.csv`);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="flex w-full items-center justify-center gap-2 rounded-buttons bg-ink-black px-4 py-3 text-[15px] font-semibold text-white"
    >
      <DownloadSimple /> Export Data to CSV
    </button>
  );
}
