// File: components/Navbar.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { userType, openAuthModal } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:scale-105 transition-transform">
            UV
          </div>
          <span className="text-lg font-semibold text-zinc-100 tracking-tight">
            UniDoc Vault
          </span>
        </Link>

        {/* Navigation / Actions */}
        <nav className="flex items-center gap-4">
          {userType === "logged_out" ? (
            <button
              onClick={openAuthModal}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2 text-sm font-medium text-zinc-200 shadow-sm transition-colors hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
            >
              Login
            </button>
          ) : (
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black shadow-sm transition-all hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
            >
              Dashboard
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}