"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { can, normalizeRole } from "@/lib/roles";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;          // auth loading
  profileLoading: boolean;    // profile loading
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Backward-compat: true for owner/admin roles. Prefer `isOwner` going forward. */
  isAdmin: boolean;
  isOwner: boolean;
  isAccountant: boolean;
  canManageFinance: boolean;
  canViewFinance: boolean;
  canManageOps: boolean;
  canManageUsers: boolean;
  isDisabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Subscribe to user profile doc when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setProfile({
            id: snap.id,
            email: d.email ?? user.email ?? "",
            displayName: d.displayName,
            role: d.role ?? "user",
            disabled: d.disabled ?? false,
            lineUserId: d.lineUserId,
            invitedBy: d.invitedBy,
            createdAt: (d.createdAt as Timestamp)?.toDate?.() ?? new Date(),
            updatedAt: (d.updatedAt as Timestamp)?.toDate?.() ?? new Date(),
          });
        } else {
          setProfile(null);
        }
        setProfileLoading(false);
      },
      (err) => {
        console.error("Profile load error:", err);
        setProfile(null);
        setProfileLoading(false);
      }
    );
    return unsub;
  }, [user]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const isDisabled = !!profile && profile.disabled === true;
  const normalized = profile ? normalizeRole(profile.role) : undefined;
  const isOwner = !!profile && !isDisabled && normalized === "owner";
  const isAccountant = !!profile && !isDisabled && (normalized === "accountant" || normalized === "owner");
  const isAdmin = isOwner; // backward-compat
  const canManageFinance = can.manageFinance(profile);
  const canViewFinance = can.viewFinance(profile);
  const canManageOps = can.manageOps(profile);
  const canManageUsers = can.manageUsers(profile);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileLoading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isOwner,
        isAccountant,
        canManageFinance,
        canViewFinance,
        canManageOps,
        canManageUsers,
        isDisabled,
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
