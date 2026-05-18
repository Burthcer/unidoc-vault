// File: components/AuthModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";

export default function AuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, closeAuthModal, loginAsGuest, loginAsUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility Toggle States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (activeTab === "signup") {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
    }
    
    // Mock Authentication
    loginAsUser();
    handleClose();
    toast.success("Welcome to UniDoc Vault Premium!");
    router.push("/dashboard");
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    handleClose();
    toast.info("Continuing as Guest. Your data will not be saved to the cloud.");
    router.push("/dashboard");
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    closeAuthModal();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900/90 backdrop-blur-xl ring-1 ring-white/10 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col relative">
        
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-8 pt-8 pb-6">
          <div className="flex justify-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              UV
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white text-center tracking-tight mb-6">
            {activeTab === "signup" ? "Create your account" : "Welcome back"}
          </h3>

          {/* Tabs */}
          <div className="flex bg-zinc-950 ring-1 ring-white/5 p-1 rounded-lg mb-6">
            <button 
              onClick={() => {
                setActiveTab("signup");
                setPassword("");
                setConfirmPassword("");
                setShowPassword(false);
                setShowConfirmPassword(false);
              }} 
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === "signup" ? "bg-zinc-800 text-white shadow-sm ring-1 ring-white/10" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Sign Up
            </button>
            <button 
              onClick={() => {
                setActiveTab("signin");
                setPassword("");
                setConfirmPassword("");
                setShowPassword(false);
                setShowConfirmPassword(false);
              }} 
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === "signin" ? "bg-zinc-800 text-white shadow-sm ring-1 ring-white/10" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Sign In
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none transition-colors ${
                    showPassword ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    // Closed Eye / Eye Slash
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    // Open Eye
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {activeTab === "signup" && (
              <div className="animate-in slide-in-from-top-2 fade-in">
                <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none transition-colors ${
                      showConfirmPassword ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            <button 
              type="submit" 
              className="w-full mt-2 py-2.5 bg-white text-black hover:bg-zinc-200 text-sm font-semibold rounded-lg transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              {activeTab === "signup" ? "Continue and Pay $2" : "Sign In to Vault"}
            </button>
          </form>
        </div>

        {/* Guest Flow Link */}
        <div className="px-8 py-5 bg-zinc-950/50 border-t border-zinc-800/50 flex justify-center">
          <button 
            onClick={handleGuestLogin}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Just browsing? Continue as Guest
          </button>
        </div>

      </div>
    </div>
  );
}