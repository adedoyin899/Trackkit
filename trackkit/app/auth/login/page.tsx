"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFlow } from "@/components/AuthFlow";
import { useTrackkitStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const user = useTrackkitStore((s) => s.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
