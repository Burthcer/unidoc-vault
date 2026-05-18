// File: app/learn-more/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function LearnMorePage() {
  const router = useRouter();
  const { isUnlocked } = useAuth();
  
  const [isChecking, setIsChecking] = useState(true);

  // Route Guard Effect
  useEffect(() => {
    if (!isUnlocked) {
      router.push("/");
    } else {
      setIsChecking(false);
    }
  }, [isUnlocked, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="text-gray-400 text-sm font-medium">Verifying Secure Access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-6 md:p-12 lg:p-24 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <button
          onClick={() => router.push("/")}
          className="mb-8 inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Home
        </button>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight">
          How UniDoc Vault Works
        </h1>
        
        <div className="space-y-10 text-gray-300 leading-relaxed text-lg">
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">1. 100% Client-Side Compression</h2>
            <p className="text-gray-400">
              Unlike traditional tools that force you to upload your sensitive ID cards to a random server, our compression engine runs entirely inside your browser using HTML5 Canvas and WebAssembly. Your files never leave your device during the compression phase.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">2. Absolute Privacy</h2>
            <p className="text-gray-400">
              We do not store your intermediate files. Because all processing happens locally in your device's memory, there is zero risk of your personal documents being intercepted or stored without your explicit consent.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">3. Advanced Format Handling</h2>
            <p className="text-gray-400">
              Whether you upload a high-resolution JPEG from an iPhone, a PNG, or a multi-page PDF, UniDoc Vault normalizes, resizes, and recompresses them to ensure they strictly meet the rigid file size limits required by regional university portals.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}