
'use client';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function FloatingAddButton() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // This button should only be visible on the home page for logged-in users.
  if (!user || pathname !== '/') {
    return null;
  }
  
  return (
    <div className="flex justify-end my-4">
        <Button
          asChild
          className="h-16 w-16 rounded-full shadow-lg"
          aria-label="Post new animal"
          style={{
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            boxShadow: '0 8px 30px hsla(var(--primary), 0.25)',
          }}
        >
          <Link href="/post/new">
            <Plus className="h-8 w-8" />
          </Link>
        </Button>
    </div>
  );
}
