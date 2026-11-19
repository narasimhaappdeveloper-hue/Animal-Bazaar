'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LogOut, User as UserIcon, Home, ArrowLeft, Bell, Info, PlusCircle, Globe, Heart } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Logo } from './icons/logo';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useEffect, useState } from 'react';
import { getStoredNotifications, SYNC_EVENT_NAME } from '@/lib/animals';

export default function Header() {
  const { user, logout, loading, language, setLanguage } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const isTelugu = language === 'te';

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const syncUnread = () => {
      const notifs = getStoredNotifications(user.uid);
      const unread = notifs.filter((n) => !n.read).length;
      setUnreadCount(unread);
    };

    syncUnread();
    window.addEventListener(SYNC_EVENT_NAME, syncUnread);
    window.addEventListener('storage', syncUnread);
    const poll = setInterval(syncUnread, 2000);

    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, syncUnread);
      window.removeEventListener('storage', syncUnread);
      clearInterval(poll);
    };
  }, [user]);

  const toggleLanguage = () => {
    setLanguage(isTelugu ? 'en' : 'te');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-emerald-800 text-white shadow-md">
      <TooltipProvider>
        <div className="container flex h-16 items-center px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="bg-white p-1 rounded-lg shadow-sm">
                <Logo className="h-7 w-7 text-emerald-800" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg tracking-tight leading-tight text-white">
                  Animal Bazaar
                </span>
                <span className="text-[10px] text-emerald-200 font-medium leading-none">
                  పశువుల బజార్
                </span>
              </div>
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-white hover:bg-emerald-700/60 text-xs font-semibold px-2 sm:px-3 h-8 border border-white/20 rounded-full"
            >
              <Globe className="h-3.5 w-3.5 mr-1 text-emerald-300" />
              {isTelugu ? 'English' : 'తెలుగు'}
            </Button>

            {/* Back Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-emerald-700/60 h-8 w-8"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isTelugu ? 'వెనుకకు' : 'Back'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Home Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="text-white hover:bg-emerald-700/60 h-8 w-8"
                >
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    <span className="sr-only">Home</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isTelugu ? 'హోమ్' : 'Home'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Notifications Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="relative text-white hover:bg-emerald-700/60 h-8 w-8"
                >
                  <Link href="/notifications">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                        {unreadCount}
                      </span>
                    )}
                    <span className="sr-only">Notifications</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isTelugu ? 'నోటిఫికేషన్లు' : 'Notifications'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Post Animal Action - Only visible after login */}
            {user && (
              <Button
                asChild
                size="sm"
                className="bg-amber-400 hover:bg-amber-500 text-stone-900 font-bold h-8 px-2.5 sm:px-3 text-xs hidden sm:flex"
              >
                <Link href="/post/new">
                  <PlusCircle className="mr-1 h-3.5 w-3.5" />
                  {isTelugu ? 'పశువును అమ్మండి' : 'Sell Animal'}
                </Link>
              </Button>
            )}

            {loading ? (
              <Skeleton className="h-8 w-8 rounded-full bg-emerald-700" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer border border-white/40">
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${user.email || user.phone}.png`}
                      alt={user.name}
                    />
                    <AvatarFallback className="bg-emerald-900 text-white font-bold text-xs">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.phone}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>{isTelugu ? 'నా ఖాతా / నా పశువులు' : 'My Profile & Uploads'}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/post/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span>{isTelugu ? 'కొత్త పశువును అమ్మండి' : 'Post Animal for Sale'}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications">
                      <Bell className="mr-2 h-4 w-4" />
                      <span>
                        {isTelugu ? 'నోటిఫికేషన్లు' : 'Notifications'}{' '}
                        {unreadCount > 0 ? `(${unreadCount})` : ''}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/about">
                      <Info className="mr-2 h-4 w-4" />
                      <span>{isTelugu ? 'యాప్ గురించి' : 'About App'}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive font-medium cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isTelugu ? 'లాగౌట్' : 'Log out'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Button asChild variant="ghost" size="sm" className="text-white hover:bg-emerald-700/60 text-xs h-8 px-2.5">
                  <Link href="/login">{isTelugu ? 'లాగిన్' : 'Login'}</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-white text-emerald-900 hover:bg-white/90 text-xs font-bold h-8 px-2.5 sm:px-3"
                >
                  <Link href="/register">{isTelugu ? 'నమోదు' : 'Register'}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </header>
  );
}
