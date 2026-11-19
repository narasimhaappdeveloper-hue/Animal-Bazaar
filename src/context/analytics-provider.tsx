'use client';
import { firebaseAnalytics } from '@/firebase';
import { useEffect } from 'react';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (firebaseAnalytics) {
      console.log('Firebase Analytics is initialized');
    }
  }, []);

  return <>{children}</>;
}
