import type { Metadata } from "next";
import { PurchaseHistoryPage } from "./PurchaseHistoryPage";

export const metadata: Metadata = {
  title: "Purchase History — Trackkit",
  description:
    "View all your restock purchases, filter by product or supplier, and compare supplier prices to find the best deals.",
};

export default function Page() {
  return <PurchaseHistoryPage />;
}
