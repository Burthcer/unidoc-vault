// File: app/page.tsx
"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import FileCompressor from "@/components/FileCompressor";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Toaster } from "sonner";
import AuthModal from "@/components/AuthModal";

export default function Home() {
  const router = useRouter();
  const { userType, openAuthModal, unlockDashboard } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    window.history.replaceState(null, "", "/");
  }, []);

  const handlePrimaryAction = () => {
    if (userType === "authenticated") {
      router.push("/dashboard");
    } else {
      openAuthModal();
    }
  };

  const handleLearnMore = () => {
    if (userType === "logged_out") {
      unlockDashboard(); 
    }
    router.push("/learn-more");
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800">
      <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: '#18181b', border: '1px solid #27272a', color: '#fff' } }} />
      <Navbar />
      
      {/* Global Mock Auth Modal */}
      <AuthModal />
      
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/[0.03] blur-[100px] pointer-events-none rounded-full" />

        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative z-10">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="flex flex-col items-center space-y-8">
              
              <div className="space-y-4 max-w-4xl">
                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                  Never fight with a <span className="text-blue-500">50KB limit</span> again.
                </h1>
                <p className="mx-auto max-w-[700px] text-zinc-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  The ultimate document vault for regional university admissions. We automatically compress your 10th/12th mark sheets and ID cards right in your browser, keeping them perfectly sized and organized.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handlePrimaryAction}
                  className={`inline-flex h-12 items-center justify-center rounded-lg px-8 text-sm font-semibold transition-all ${
                    userType === "guest"
                    ? "bg-zinc-950 text-zinc-100 ring-1 ring-zinc-700 hover:bg-zinc-900 shadow-sm"
                    : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                  }`}
                >
                  {userType === "authenticated" 
                    ? "Go to Dashboard" 
                    : userType === "guest" 
                      ? "Create Account to Unlock Premium" 
                      : "Get Started for $2"}
                </button>
                <button
                  onClick={handleLearnMore}
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 px-8 text-sm font-medium text-zinc-200 shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none"
                >
                  Learn More
                </button>
              </div>

              <div className="pt-8 text-xs text-zinc-500 font-medium flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Client-side compression
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Web Crypto Encryption
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  No Server Storage
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="w-full pb-24 relative z-10">
           <div className="container mx-auto px-4 md:px-6 max-w-3xl">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Try it right now</h2>
                <p className="text-zinc-400 text-sm">Upload a large image below and watch it compress instantly.</p>
              </div>
              <FileCompressor docId="demo-doc" docName="Demo_Document" sides={1} maxSizeKB={50} />
           </div>
        </section>
      </main>
    </div>
  );
}