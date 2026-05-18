// File: lib/VaultContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface Vault {
  id: string;
  name: string;
}

interface VaultContextType {
  vaults: Vault[];
  activeVaultId: string;
  addVault: (name: string) => void;
  deleteVault: (id: string) => void;
  setActiveVault: (id: string) => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vaults, setVaults] = useState<Vault[]>([{ id: 'default', name: 'General Admissions' }]);
  const [activeVaultId, setActiveVaultId] = useState('default');

  const addVault = (name: string) => {
    const newVault = { id: `vault-${Date.now()}`, name };
    setVaults([...vaults, newVault]);
    setActiveVaultId(newVault.id);
  };

  const deleteVault = (id: string) => {
    const updated = vaults.filter(v => v.id !== id);
    setVaults(updated);
    if (activeVaultId === id) {
      setActiveVaultId(updated.length > 0 ? updated[0].id : '');
    }
  };

  return (
    <VaultContext.Provider value={{ vaults, activeVaultId, addVault, deleteVault, setActiveVault: setActiveVaultId }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (context === undefined) throw new Error("useVault must be used within VaultProvider");
  return context;
}