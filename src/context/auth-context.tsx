'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  phone: string;
  name: string;
  location?: string;
  role: 'buyer' | 'seller' | 'both';
  createdAt?: any;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  signOut: async () => {},
  refreshUserProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // 1. క్లయింట్ బ్రౌజర్ పూర్తిగా మౌంట్ అయ్యే వరకు ఆగడం (Hydration mismatch నివారిస్తుంది)
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchProfile = async (uid: string, phone: string) => {
    try {
      if (!db) return;
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        setUser(userSnap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid,
          phone,
          name: 'Farmer/User',
          role: 'both',
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newProfile);
        setUser(newProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    // auth లేకపోతే క్రాష్ అవ్వకుండా నిరోధించడం
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      setFirebaseUser(currUser);
      if (currUser && currUser.phoneNumber) {
        await fetchProfile(currUser.uid, currUser.phoneNumber);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      if (auth) {
        await fbSignOut(auth);
      }
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  const refreshUserProfile = async () => {
    if (firebaseUser && firebaseUser.phoneNumber) {
      await fetchProfile(firebaseUser.uid, firebaseUser.phoneNumber);
    }
  };

  // క్లయింట్ మౌంట్ కాకముందు క్రాష్ రాకుండా ఖాళీ లేదా సురక్షిత వ్యూ ఇవ్వడం
  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signOut, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
