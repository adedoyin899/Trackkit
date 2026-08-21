"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CloudArrowUp,
  Gear,
  Package,
  Plus,
  SquaresFour,
  Storefront,
  SignIn,
  SignOut,
  Coins,
  ClockCounterClockwise,
  ChartLineUp,
  Sparkle,
  PaintBrush,
  User,
  MapPin,
  Tag,
  TrendUp,
  DotsThreeCircle,
  X,
  CaretRight,
  ArrowsClockwise,
  type Icon,
} from "@phosphor-icons/react";
import { useLocalInventory } from "@/hooks/useLocalInventory";
import { useDatabaseStatus } from "@/lib/db-context";
import { useTrackkitStore, type Tab } from "@/lib/store";
import { sortByLowStockFirst } from "@/lib/product-utils";
import { ProductCard } from "@/components/ProductCard";
import { ProductForm } from "@/components/ProductForm";
import { Dashboard } from "@/components/Dashboard";
import { ExportButton } from "@/components/ExportButton";
import { useAuth } from "@/hooks/useAuth";
import { ProfitabilityDashboard } from "@/components/ProfitabilityDashboard";
import { PurchaseHistoryDashboard } from "@/components/PurchaseHistoryDashboard";
import { AIChat } from "@/components/AIChat";
import { TrendsView } from "@/components/TrendsView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProductInspector } from "@/components/ProductInspector";

const ALL_TABS: { id: Tab; label: string; icon: Icon; description?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: SquaresFour, description: "Overview & stock alerts" },
  { id: "inventory", label: "Inventory", icon: Package, description: "Product catalog & stock" },
  { id: "margins", label: "Margins", icon: Coins, description: "Profit margin analytics" },
  { id: "ai", label: "AI Copilot", icon: Sparkle, description: "Smart assistant & restock tips" },
  { id: "history", label: "History", icon: ClockCounterClockwise, description: "Supplier restocks & price log" },
  { id: "trends", label: "Trends", icon: ChartLineUp, description: "Sales speed & demand trends" },
  { id: "settings", label: "Settings", icon: Gear, description: "Shop profile, currency & backup" },
];

// 4 Primary Mobile Navigation Tabs
const PRIMARY_MOBILE_TABS: { id: Tab; label: string; icon: Icon }[] = [
  { id: "dashboard", label: "Dashboard", icon: SquaresFour },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "margins", label: "Margins", icon: Coins },
  { id: "ai", label: "Copilot", icon: Sparkle },
];

// Secondary Tabs under Progressive Disclosure "More" Menu
const SECONDARY_MOBILE_TABS: { id: Tab; label: string; icon: Icon; description: string }[] = [
  { id: "history", label: "Purchase History", icon: ClockCounterClockwise, description: "Supplier restocks & price log" },
  { id: "trends", label: "Sales Trends", icon: ChartLineUp, description: "Sales demand & fast movers" },
  { id: "settings", label: "Settings & Profile", icon: Gear, description: "Shop identity, currency, & backups" },
];

function InventoryTab() {
  const { products, isLoading } = useLocalInventory();
  const [showAddForm, setShowAddForm] = useState(false);
  const selectedProductId = useTrackkitStore((s) => s.selectedProductId);
  const setSelectedProductId = useTrackkitStore((s) => s.setSelectedProductId);
  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null;
  const sortedProducts = useMemo(() => sortByLowStockFirst(products), [products]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[19px] font-medium text-heading-charcoal">All Products</h2>
          <p className="text-[12px] text-muted-gray">Select any product card for instant desktop inspection and details.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 rounded-buttons bg-ink-black px-4 py-2 text-[14px] font-semibold text-[var(--color-ink-black-text)] cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Plus /> Add Product
        </button>
      </div>

      {isLoading && <p className="text-[14px] text-muted-gray">Loading…</p>}

      {!isLoading && products.length === 0 && (
        <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-8 text-center shadow-subtle-3">
          <p className="text-[16px] text-body-brown">No products yet.</p>
          <p className="mt-1 text-[13px] text-muted-gray">
            Tap &ldquo;+ Add Product&rdquo; to start tracking your stock.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
            selectedProduct
              ? "lg:col-span-7 xl:col-span-8 lg:grid-cols-2"
              : "lg:col-span-12 lg:grid-cols-3 xl:grid-cols-3"
          }`}
        >
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Desktop Progressive Disclosure Inspector Panel */}
        {selectedProduct && (
          <div className="hidden lg:col-span-5 xl:col-span-4 lg:block">
            <ProductInspector
              product={selectedProduct}
              onClose={() => setSelectedProductId(null)}
            />
          </div>
        )}
      </div>

      {showAddForm && (
        <ProductForm onClose={() => setShowAddForm(false)} />
      )}
    </div>
  );
}

function SettingsTab({ onOpenLogoutModal }: { onOpenLogoutModal: () => void }) {
  const shopName = useTrackkitStore((s) => s.shopName);
  const setShopName = useTrackkitStore((s) => s.setShopName);
  const traderName = useTrackkitStore((s) => s.traderName);
  const setTraderName = useTrackkitStore((s) => s.setTraderName);
  const marketLocation = useTrackkitStore((s) => s.marketLocation);
  const setMarketLocation = useTrackkitStore((s) => s.setMarketLocation);
  const currency = useTrackkitStore((s) => s.currency);
  const setCurrency = useTrackkitStore((s) => s.setCurrency);
  const targetMarginGoal = useTrackkitStore((s) => s.targetMarginGoal);
  const setTargetMarginGoal = useTrackkitStore((s) => s.setTargetMarginGoal);
  const defaultLowStockThreshold = useTrackkitStore((s) => s.defaultLowStockThreshold);
  const setDefaultLowStockThreshold = useTrackkitStore((s) => s.setDefaultLowStockThreshold);
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Theme & Appearance */}
      <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-4 sm:p-5 shadow-subtle-3">
        <h3 className="mb-3 flex items-center gap-1.5 text-[15px] font-medium text-heading-charcoal">
          <PaintBrush /> Appearance & Theme
        </h3>
        <p className="mb-3 text-[13px] text-muted-gray">
          Choose light mode, dark mode, or follow your system preference.
        </p>
        <ThemeToggle variant="full" />
      </div>

      {/* Shop & Trader Profile */}
      <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-4 sm:p-5 shadow-subtle-3 space-y-4">
        <h3 className="flex items-center gap-1.5 text-[15px] font-medium text-heading-charcoal">
          <Storefront /> Shop & Trader Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-medium text-body-brown">
              <Storefront size={15} /> Shop Name
            </label>
            <input
              value={shopName ?? ""}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Mama Ngozi Stores"
              className="mt-1.5 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2.5 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-medium text-body-brown">
              <User size={15} /> Trader / Owner Name
            </label>
            <input
              value={traderName ?? ""}
              onChange={(e) => setTraderName(e.target.value)}
              placeholder="e.g. Mama Ngozi, Amara"
              className="mt-1.5 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2.5 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-[13px] font-medium text-body-brown">
            <MapPin size={15} /> Market Location
          </label>
          <input
            value={marketLocation ?? ""}
            onChange={(e) => setMarketLocation(e.target.value)}
            placeholder="e.g. Balogun Market, Lagos"
            className="mt-1.5 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2.5 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
          />
        </div>
      </div>

      {/* Currency & Financial Targets */}
      <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-4 sm:p-5 shadow-subtle-3 space-y-4">
        <h3 className="flex items-center gap-1.5 text-[15px] font-medium text-heading-charcoal">
          <Coins /> Currency & Profit Targets
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-[13px] font-medium text-body-brown mb-1.5">
              Currency Symbol
            </label>
            <div className="flex gap-1.5">
              {["₦", "₵", "$", "£", "€"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`flex-1 rounded-lg border py-2 text-[14px] font-bold cursor-pointer transition-all ${
                    currency === c
                      ? "border-[var(--color-link-blue)] bg-[var(--color-link-blue)]/15 text-heading-charcoal"
                      : "border-[var(--border-hairline)] bg-[var(--surface-canvas)] text-muted-gray hover:text-heading-charcoal"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-body-brown mb-1.5">
              Target Margin Goal (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={targetMarginGoal}
              onChange={(e) => setTargetMarginGoal(Number(e.target.value) || 20)}
              className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-body-brown mb-1.5">
              Low Stock Alert (units)
            </label>
            <input
              type="number"
              min="1"
              value={defaultLowStockThreshold}
              onChange={(e) => setDefaultLowStockThreshold(Number(e.target.value) || 5)}
              className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
            />
          </div>
        </div>
      </div>

      {/* Setup & Marketing */}
      <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-4 sm:p-5 shadow-subtle-3">
        <h3 className="mb-2 flex items-center gap-1.5 text-[15px] font-medium text-heading-charcoal">
          <Storefront /> Onboarding & Setup Wizard
        </h3>
        <p className="mb-4 text-[13px] text-muted-gray">
          Visit the Trackkit marketing landing page or restart the shop setup wizard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/welcome"
            className="flex-1 rounded-buttons border border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-2.5 px-4 text-center text-[14px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors"
          >
            Visit Landing Page
          </Link>
          <Link
            href="/onboarding"
            className="flex-1 rounded-buttons bg-ink-black py-2.5 px-4 text-center text-[14px] font-semibold text-[var(--color-ink-black-text)] hover:opacity-90 transition-opacity"
          >
            Re-run Setup Wizard
          </Link>
        </div>
      </div>

      {/* CSV Export & Backup */}
      <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-4 sm:p-5 shadow-subtle-3">
        <h3 className="mb-2 flex items-center gap-1.5 text-[15px] font-medium text-heading-charcoal">
          <CloudArrowUp /> Data Backup
        </h3>
        <p className="mb-4 text-[13px] text-muted-gray">
          Export your inventory as a CSV spreadsheet backup.
        </p>
        <ExportButton />
      </div>

      {/* Account & Session Management (Always Accessible) */}
      <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-4 sm:p-5 shadow-subtle-3 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[15px] font-medium text-heading-charcoal">
            <SignOut /> Session & Log Out
          </h3>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              user
                ? "bg-[var(--color-grass-green)]/15 text-[var(--color-grass-green)]"
                : "bg-ink-black/10 text-heading-charcoal"
            }`}
          >
            {user ? "Cloud Account Active" : "Local Offline Mode"}
          </span>
        </div>

        <p className="text-[13px] text-muted-gray">
          {user
            ? `Signed in as ${user.phoneNumber ?? user.email}. Logging out will close your cloud session on this device.`
            : "You are currently working in local offline mode. Logging out allows you to switch shop profiles or sign into a cloud account."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {!user && (
            <Link
              href="/auth/login"
              className="flex-1 rounded-buttons border border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-2.5 px-4 text-center text-[14px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors flex items-center justify-center gap-1.5"
            >
              <SignIn size={16} /> Connect Cloud Account
            </Link>
          )}
          <button
            type="button"
            onClick={onOpenLogoutModal}
            className="flex-1 rounded-buttons bg-[var(--color-alert-red)] py-2.5 px-4 text-center text-[14px] font-semibold text-white hover:opacity-90 cursor-pointer transition-opacity flex items-center justify-center gap-1.5"
          >
            <SignOut size={16} /> Log Out / Switch Shop
          </button>
        </div>
      </div>
    </div>
  );
}

// Log Out Confirmation Dialog
function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { user } = useAuth();
  const shopName = useTrackkitStore((s) => s.shopName);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-alert-red)]/15 text-[var(--color-alert-red)]">
            <SignOut size={20} weight="bold" />
          </span>
          <div>
            <h3 className="text-[17px] font-bold text-heading-charcoal">
              Log Out of Shop?
            </h3>
            <p className="text-[12px] text-muted-gray">
              {shopName ? `${shopName}` : "Active Workspace"}
            </p>
          </div>
        </div>

        <p className="text-[13px] text-body-brown leading-relaxed">
          {user
            ? `You will be signed out from your account (${user.phoneNumber ?? user.email}). Your local catalog remains stored safely on this device.`
            : "Logging out will reset your active shop workspace and return you to the onboarding welcome screen. Your offline data remains saved locally."}
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-buttons border border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-2.5 text-[14px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-buttons bg-[var(--color-alert-red)] py-2.5 text-[14px] font-semibold text-white hover:opacity-90 cursor-pointer transition-opacity"
          >
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

// Progressive Disclosure Mobile "More" Drawer Sheet
function MoreDrawer({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onOpenLogout,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentTab: Tab;
  onSelectTab: (tab: Tab) => void;
  onOpenLogout: () => void;
}) {
  const { user } = useAuth();
  const shopName = useTrackkitStore((s) => s.shopName);
  const traderName = useTrackkitStore((s) => s.traderName);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg mx-auto rounded-t-3xl border-t border-[var(--border-hairline)] bg-[var(--surface-card)] p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-250">
        {/* Handle bar */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--border-hairline)]" />

        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3 mb-3">
          <div>
            <h3 className="text-[17px] font-bold text-heading-charcoal">More Tools & Options</h3>
            <p className="text-[12px] text-muted-gray">
              {shopName ? `${shopName} · ${traderName || "Owner"}` : "Workspace Tools"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-gray hover:bg-[var(--surface-canvas)] hover:text-heading-charcoal cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Secondary Tool Links */}
        <div className="space-y-1.5">
          {SECONDARY_MOBILE_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onSelectTab(tab.id);
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] font-semibold shadow-sm"
                    : "text-heading-charcoal hover:bg-[var(--surface-canvas)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      isActive ? "bg-white/20 text-white" : "bg-[var(--surface-canvas)] text-heading-charcoal border border-[var(--border-hairline)]"
                    }`}
                  >
                    <TabIcon size={18} weight={isActive ? "fill" : "regular"} />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold">{tab.label}</p>
                    <p className={`text-[11px] ${isActive ? "text-white/80" : "text-muted-gray"}`}>
                      {tab.description}
                    </p>
                  </div>
                </div>
                <CaretRight size={16} className={isActive ? "text-white/80" : "text-muted-gray"} />
              </button>
            );
          })}
        </div>

        {/* Divider & Log Out */}
        <div className="mt-4 border-t border-[var(--border-hairline)] pt-3 space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLogout();
            }}
            className="flex w-full items-center justify-between rounded-xl p-3 text-left text-[var(--color-alert-red)] hover:bg-[var(--color-alert-red)]/10 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-alert-red)]/10 text-[var(--color-alert-red)]">
                <SignOut size={18} weight="bold" />
              </span>
              <div>
                <p className="text-[14px] font-bold">Log Out / Switch Shop</p>
                <p className="text-[11px] text-muted-gray">
                  {user ? `Signed in as ${user.phoneNumber ?? user.email}` : "Reset current local workspace"}
                </p>
              </div>
            </div>
            <CaretRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const currentTab = useTrackkitStore((s) => s.currentTab);
  const setCurrentTab = useTrackkitStore((s) => s.setCurrentTab);
  const shopName = useTrackkitStore((s) => s.shopName);
  const traderName = useTrackkitStore((s) => s.traderName);
  const marketLocation = useTrackkitStore((s) => s.marketLocation);
  const resetSession = useTrackkitStore((s) => s.resetSession);
  const { ready, error } = useDatabaseStatus();
  const { user, logout } = useAuth();

  // Progressive Disclosure State for Mobile "More" Drawer & Logout Modal
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isMoreTabActive = ["history", "trends", "settings"].includes(currentTab);

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    try {
      if (user) {
        await logout();
      }
      resetSession();
      router.push("/welcome");
      router.refresh();
    } catch {
      resetSession();
      router.push("/welcome");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)]">
      {/* Desktop Left Navigation Sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-[var(--border-hairline)] bg-[var(--surface-card)] p-4 shadow-subtle-3">
        {/* Brand Header */}
        <div className="flex items-center gap-3 border-b border-[var(--border-hairline)] pb-4 px-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-hot-coral)] text-white shadow-coral">
            <Storefront weight="fill" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[20px] font-extrabold tracking-tight text-heading-charcoal truncate">
              {shopName || "Trackkit"}
            </h1>
            <p className="truncate text-[12px] text-muted-gray">
              {traderName ? `${traderName}` : marketLocation || "Offline Retail Workspace"}
            </p>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="mt-4 flex-1 space-y-1.5">
          {ALL_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                className={`monzo-pill flex w-full items-center gap-3 px-4 py-2.5 text-[14px] font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] shadow-sm"
                    : "text-muted-gray hover:bg-[var(--surface-card-secondary)] hover:text-heading-charcoal"
                }`}
              >
                <TabIcon size={18} weight={isActive ? "fill" : "regular"} className={isActive ? "text-[var(--color-hot-coral)]" : ""} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Desktop Sidebar Bottom Footer with Quick Logout */}
        <div className="border-t border-[var(--border-hairline)] pt-4 px-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted-gray">Theme</span>
            <ThemeToggle />
          </div>

          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-gray">
              <span className="truncate max-w-[120px] font-medium">
                {user ? (user.phoneNumber ?? user.email) : "Offline Mode"}
              </span>
              <span className="h-2 w-2 rounded-full bg-[var(--color-grass-green)] animate-pulse" />
            </div>

            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="monzo-pill flex w-full items-center justify-center gap-1.5 border border-[var(--border-hairline)] py-1.5 text-[12px] font-bold text-body-brown hover:text-[var(--color-alert-red)] hover:border-[var(--color-alert-red)]/30 hover:bg-[var(--color-alert-red)]/5 cursor-pointer transition-colors"
            >
              <SignOut size={13} /> Log Out / Switch
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header with Theme Toggle & Profile / Logout Action */}
        <header className="flex md:hidden items-center justify-between px-3.5 sm:px-6 pt-5 pb-3 mb-2 border-b border-[var(--border-hairline)] bg-[var(--surface-card)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-hot-coral)] text-white shadow-xs">
              <Storefront weight="fill" size={17} />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-[18px] font-extrabold tracking-tight text-heading-charcoal truncate">
                {shopName || "Trackkit"}
              </h1>
              {traderName && (
                <p className="text-[11px] text-muted-gray truncate">{traderName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              title="Log Out / Switch Account"
              aria-label="Log Out / Switch Account"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-canvas)] text-muted-gray hover:text-[var(--color-alert-red)] transition-colors cursor-pointer"
            >
              <SignOut size={16} />
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--surface-card)] px-8 py-4 mb-6 shadow-subtle-3">
          <div>
            <h2 className="font-display text-[20px] font-extrabold text-heading-charcoal capitalize">
              {currentTab}
            </h2>
            <p className="text-[12px] text-muted-gray">
              {shopName
                ? `${shopName}${marketLocation ? ` · ${marketLocation}` : " · Workspace"}`
                : "Desktop Workspace"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="monzo-pill flex items-center gap-1.5 border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3.5 py-1.5 text-[13px] font-bold text-body-brown hover:text-[var(--color-alert-red)] transition-colors cursor-pointer"
            >
              <SignOut size={15} /> Log Out
            </button>
          </div>
        </header>

        {/* Page Content Container with balanced mobile padding */}
        <main className="flex-1 px-3.5 pb-24 md:pb-12 pt-2 sm:px-6 md:px-8 max-w-7xl w-full mx-auto">
          {!ready && !error && (
            <p className="text-[14px] text-muted-gray">Loading your local inventory…</p>
          )}
          {error && (
            <p className="text-[14px] text-[var(--color-alert-red)]">
              Could not open local database: {error.message}
            </p>
          )}

          {ready && (
            <>
              {currentTab === "dashboard" && <Dashboard />}
              {currentTab === "inventory" && <InventoryTab />}
              {currentTab === "margins" && <ProfitabilityDashboard />}
              {currentTab === "history" && <PurchaseHistoryDashboard />}
              {currentTab === "trends" && <TrendsView />}
              {currentTab === "ai" && <AIChat />}
              {currentTab === "settings" && <SettingsTab onOpenLogoutModal={() => setIsLogoutModalOpen(true)} />}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (4 Core Tabs + 1 Progressive Disclosure "More" Button) */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-hairline)] bg-[var(--surface-card)]/95 backdrop-blur-md px-1 py-1 safe-area-pb">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {PRIMARY_MOBILE_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-bold cursor-pointer transition-colors ${
                  isActive ? "text-[var(--color-hot-coral)]" : "text-muted-gray hover:text-heading-charcoal"
                }`}
              >
                <TabIcon size={20} weight={isActive ? "fill" : "regular"} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}

          {/* 5th Progressive Disclosure "More" Button */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-bold cursor-pointer transition-colors relative ${
              isMoreTabActive ? "text-[var(--color-hot-coral)]" : "text-muted-gray hover:text-heading-charcoal"
            }`}
          >
            <DotsThreeCircle size={20} weight={isMoreTabActive ? "fill" : "regular"} />
            <span className="truncate">More</span>
            {isMoreTabActive && (
              <span className="absolute top-1.5 right-4 h-1.5 w-1.5 rounded-full bg-[var(--color-hot-coral)]" />
            )}
          </button>
        </div>
      </nav>

      {/* Progressive Disclosure More Drawer */}
      <MoreDrawer
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
      />

      {/* Logout Confirmation Dialog */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
