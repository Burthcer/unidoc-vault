// File: lib/AuthContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface ProfileData {
  firstName: string;
  lastName: string;
  course: string;
}

export type UserType = "logged_out" | "guest" | "authenticated";

interface AuthContextType {
  isUnlocked: boolean;
  userType: UserType;
  profileData: ProfileData;
  isAuthModalOpen: boolean;
  
  unlockDashboard: () => void;
  updateProfile: (data: ProfileData) => void;
  
  loginAsGuest: () => void;
  loginAsUser: () => void;
  logout: () => void;
  
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userType, setUserType] = useState<UserType>("logged_out");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    course: "",
  });

  const unlockDashboard = () => {
    setIsUnlocked(true);
  };

  const updateProfile = (data: ProfileData) => {
    setProfileData(data);
  };

  const loginAsGuest = () => {
    setUserType("guest");
    setIsUnlocked(true);
  };

  const loginAsUser = () => {
    setUserType("authenticated");
    setIsUnlocked(true);
  };

  const logout = () => {
    setUserType("logged_out");
    setIsUnlocked(false);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider 
      value={{ 
        isUnlocked, 
        userType, 
        profileData, 
        isAuthModalOpen,
        unlockDashboard, 
        updateProfile,
        loginAsGuest,
        loginAsUser,
        logout,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}