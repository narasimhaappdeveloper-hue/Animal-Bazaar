'use client';
import type { User } from '@/lib/definitions';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const createMockUser = (phone: string): User => ({
  uid: 'mock-user-123',
  name: 'Demo User',
  email: 'demo.user@example.com',
  phone: phone,
  createdAt: Date.now(),
  lastActive: Date.now(),
});

export interface RegisterUserData {
  name: string;
  phone: string;
  email?: string;
  state?: string;
  location?: string;
  village?: string;
  pincode?: string;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, name?: string, email?: string) => void;
  registerUser: (data: RegisterUserData) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load user from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (phone: string, name?: string, email?: string) => {
    try {
      const newUser = createMockUser(phone);
      if (name) newUser.name = name;
      if (email) newUser.email = email;
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      router.push('/');
    } catch (error) {
      console.error('Failed to save user to localStorage during login:', error);
    }
  };

  const registerUser = (data: RegisterUserData) => {
    try {
      const newUser: User = {
        uid: 'user-' + Date.now(),
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || '',
        state: data.state,
        location: data.location,
        village: data.village?.trim(),
        pincode: data.pincode?.trim(),
        createdAt: Date.now(),
        lastActive: Date.now(),
      };
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      router.push('/');
    } catch (error) {
      console.error('Failed to register user to localStorage:', error);
    }
  };

  const logout = () => {
    try {
      setUser(null);
      localStorage.removeItem('user');
      router.push('/login');
    } catch (error) {
      console.error('Failed to remove user from localStorage during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, registerUser, logout, loading }}>
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
