// File: app/dashboard/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { VaultProvider, useVault } from "@/lib/VaultContext";
import Link from "next/link";
import { Toaster } from "sonner";

function Sidebar({ openProfileModal }: { openProfileModal: () => void }) {
  const { vaults, activeVaultId, setActiveVault, addVault, deleteVault } = useVault();
  const [isAdding, setIsAdding] = useState(false);
  const [newVaultName, setNewVaultName] = useState("");

  const handleAdd = () => {
    if(newVaultName.trim()) {
      addVault(newVaultName.trim());
      setNewVaultName("");
      setIsAdding(false);
    }
  }

  const handleCancelAdd = () => {
    setNewVaultName("");
    setIsAdding(false);
  }

  return (
    <div className="w-64 flex-shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full z-20">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:scale-105 transition-transform">UV</div>
          <span className="font-semibold text-zinc-100 tracking-tight">UniDoc Vault</span>
        </Link>
      </div>
      
      <div className="flex-1 px-4 overflow-y-auto space-y-1 mt-2">
        <div className="text-xs font-semibold text-zinc-500 mb-4 px-2 uppercase tracking-wider">Your Vaults</div>
        
        <button
          onClick={() => setActiveVault("all")}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all mb-2 flex items-center gap-2 ${
            activeVaultId === "all" 
            ? 'bg-zinc-800 text-zinc-100 font-medium border border-zinc-700 shadow-sm' 
            : 'text-zinc-400 hover:bg-zinc-900 border border-transparent hover:text-zinc-200'
          }`}
        >
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          All Documents
        </button>

        {vaults.map(v => (
          <div key={v.id} className="group flex items-center relative">
            <button
              onClick={() => setActiveVault(v.id)}
              className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-all pr-8 ${
                activeVaultId === v.id 
                ? 'bg-zinc-800 text-zinc-100 font-medium border border-zinc-700 shadow-sm' 
                : 'text-zinc-400 hover:bg-zinc-900 border border-transparent hover:text-zinc-200'
              }`}
            >
              {v.name}
            </button>
            {v.id !== 'default' && (
              <button 
                onClick={(e) => { e.stopPropagation(); deleteVault(v.id); }}
                className="absolute right-2 p-1.5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-all"
                title="Delete Vault"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </div>
        ))}

        {isAdding ? (
          <div className="mt-2 flex items-center gap-1">
            <input 
              autoFocus value={newVaultName} onChange={e => setNewVaultName(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition-all" 
              placeholder="Vault name..." 
            />
            <button onClick={handleAdd} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
            <button onClick={handleCancelAdd} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className="w-full text-left px-3 py-2 mt-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            New Vault
          </button>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500 font-bold text-sm">S</div>
          <div className="text-sm font-medium text-zinc-300 truncate w-24">Settings</div>
        </div>
        <button onClick={openProfileModal} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors" title="Profile Settings">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isUnlocked, profileData, updateProfile } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState(profileData);

  useEffect(() => {
    if (!isUnlocked) {
      router.replace("/");
    } else {
      setIsChecking(false);
    }
  }, [isUnlocked, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin mb-4" />
        <p className="text-zinc-400 text-sm font-medium">Securing connection...</p>
      </div>
    )
  }

  const handleOpenProfileModal = () => {
    setLocalProfile(profileData);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = () => {
    updateProfile(localProfile);
    setIsProfileModalOpen(false);
  };

  return (
    <VaultProvider>
      <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans overflow-hidden selection:bg-zinc-800">
        <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: '#18181b', border: '1px solid #27272a', color: '#fff' } }} />
        
        <Sidebar openProfileModal={handleOpenProfileModal} />
        
        <main className="flex-1 overflow-y-auto bg-zinc-950 relative">
          <div className="relative z-10 w-full h-full">
            {children}
          </div>
        </main>
      </div>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-white mb-2">Profile Settings</h3>
            <p className="text-sm text-zinc-400 mb-6">Saved details automatically rename your compressed documents.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">First Name</label>
                <input 
                  type="text" value={localProfile.firstName} 
                  onChange={(e) => setLocalProfile({...localProfile, firstName: e.target.value})} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. Rahul" 
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Last Name</label>
                <input 
                  type="text" value={localProfile.lastName} 
                  onChange={(e) => setLocalProfile({...localProfile, lastName: e.target.value})} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. Sharma" 
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Course / Application</label>
                <input 
                  type="text" value={localProfile.course} 
                  onChange={(e) => setLocalProfile({...localProfile, course: e.target.value})} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. BCA 2025" 
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsProfileModalOpen(false)} className="flex-1 py-2 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-all">Cancel</button>
              <button onClick={handleSaveProfile} className="flex-1 py-2 bg-white text-black hover:bg-zinc-200 text-sm font-semibold rounded-lg transition-all">Save Profile</button>
            </div>
          </div>
        </div>
      )}
    </VaultProvider>
  );
}