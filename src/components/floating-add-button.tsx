'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function FloatingAddButton() {
  const pathname = usePathname();
  const { user, language } = useAuth();
  const isTelugu = language === 'te';

  // Only show the floating "Sell Animal" button if the user is logged in
  // and NOT on post/login/register/forgot-password pages
  if (
    !user ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/post/new'
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        asChild
        className="h-14 px-5 rounded-full shadow-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-2 border-2 border-white/50 hover:scale-105 transition-all duration-200"
        aria-label="Post animal"
      >
        <Link href="/post/new">
          <Plus className="h-6 w-6" />
          <span className="text-sm font-semibold">{isTelugu ? 'పశువును అమ్మండి' : 'Sell Animal'}</span>
        </Link>
      </Button>
    </div>
  );
}
