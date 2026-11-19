'use client';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';
import { firebaseConfig } from './config';

let app: FirebaseApp;
let analytics: Analytics | null = null;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

isAnalyticsSupported()
  .then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  })
  .catch((err) => {
    console.error('Firebase analytics initialization failed:', err);
  });

export const firebaseApp = app;
export const firebaseAnalytics = analytics;
