'use client';

import type { User } from '@/lib/definitions';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  login: (phone: string, password?: string, fullName?: string) => boolean;
  register: (userData: {
    name: string;
    email: string;
    phone: string;
    state?: string;
    district?: string;
    village?: string;
    pincode?: string;
    password?: string;
  }) => void;
  updateProfile: (updates: Partial<User>) => void;
  logout: () => void;
  loading: boolean;
  language: 'te' | 'en';
  setLanguage: (lang: 'te' | 'en') => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ACTIVE_USER_KEY = 'animal_bazaar_active_user';
const USERS_DB_KEY = 'animal_bazaar_registered_users';
const LANG_KEY = 'animal_bazaar_language';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<'te' | 'en'>('te');
  const router = useRouter();

  useEffect(() => {
    try {
      const storedActive = localStorage.getItem(ACTIVE_USER_KEY);
      if (storedActive) {
        setUser(JSON.parse(storedActive));
      }
      const savedLang = localStorage.getItem(LANG_KEY);
      if (savedLang === 'en' || savedLang === 'te') {
        setLanguageState(savedLang);
      }
    } catch (err) {
      console.error('Failed to load user or language from localStorage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const setLanguage = (lang: 'te' | 'en') => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (err) {
      console.error('Failed to persist language preference:', err);
    }
  };

  const register = (userData: {
    name: string;
    email: string;
    phone: string;
    state?: string;
    district?: string;
    village?: string;
    pincode?: string;
    password?: string;
  }) => {
    try {
      const cleanPhone = userData.phone.trim();
      const newUser: User = {
        uid: 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        name: userData.name.trim(),
        email: userData.email.trim() || `${cleanPhone.replace(/\D/g, '')}@animalbazaar.in`,
        phone: cleanPhone,
        state: userData.state || 'Telangana',
        district: userData.district || 'Hyderabad',
        village: userData.village || '',
        pincode: userData.pincode || '',
        createdAt: Date.now(),
        lastActive: Date.now(),
      };

      // Save to registered users list
      const rawUsers = localStorage.getItem(USERS_DB_KEY);
      const existingUsers: Record<string, { user: User; password?: string }> = rawUsers ? JSON.parse(rawUsers) : {};
      existingUsers[cleanPhone] = { user: newUser, password: userData.password };
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(existingUsers));

      // Set active session
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
      router.push('/');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const login = (phone: string, password?: string, fullName?: string): boolean => {
    try {
      const cleanPhone = phone.trim();
      const rawUsers = localStorage.getItem(USERS_DB_KEY);
      const existingUsers: Record<string, { user: User; password?: string }> = rawUsers ? JSON.parse(rawUsers) : {};

      if (existingUsers[cleanPhone]) {
        const found = existingUsers[cleanPhone].user;
        found.lastActive = Date.now();
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(found));
        setUser(found);
        router.push('/');
        return true;
      }

      // If user doesn't exist, create authentic account with their entered phone/details
      const digits = cleanPhone.replace(/\D/g, '');
      const defaultName = fullName || (digits.length >= 4 ? `రైతు (Farmer) ${digits.slice(-4)}` : 'రైతు / Farmer');
      const newUser: User = {
        uid: 'user_' + Date.now().toString(36),
        name: defaultName,
        email: `${digits || 'farmer'}@animalbazaar.in`,
        phone: cleanPhone,
        state: 'Telangana',
        district: 'Hyderabad',
        createdAt: Date.now(),
        lastActive: Date.now(),
      };

      existingUsers[cleanPhone] = { user: newUser, password };
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(existingUsers));
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
      router.push('/');
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = { ...user, ...updates, lastActive: Date.now() };
      setUser(updatedUser);
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(updatedUser));

      // Also update in registered users DB
      const rawUsers = localStorage.getItem(USERS_DB_KEY);
      if (rawUsers) {
        const existingUsers = JSON.parse(rawUsers);
        if (existingUsers[user.phone]) {
          existingUsers[user.phone].user = updatedUser;
          localStorage.setItem(USERS_DB_KEY, JSON.stringify(existingUsers));
        }
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const logout = () => {
    try {
      setUser(null);
      localStorage.removeItem(ACTIVE_USER_KEY);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateProfile, logout, loading, language, setLanguage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
