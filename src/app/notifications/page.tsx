'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, CheckCircle2, Phone, MessageSquare, Trash2, Tag, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { getStoredNotifications, markNotificationRead } from '@/lib/animals';
import type { NotificationItem } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user, language } = useAuth();
  const isTelugu = language === 'te';
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (user) {
      const list = getStoredNotifications(user.uid);
      setNotifications(list);
    }
  }, [user]);

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleClearAll = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('animal_bazaar_notifications', JSON.stringify([]));
      setNotifications([]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="shadow-md border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Bell className="h-5 w-5 text-primary" />
              {isTelugu ? 'నోటిఫికేషన్లు (Notifications)' : 'Notifications & Inquiries'}
            </CardTitle>
            <CardDescription>
              {isTelugu
                ? 'కొనుగోలుదారుల నుండి వచ్చిన ఆఫర్లు మరియు విచారణల సమాచారం.'
                : 'Buyer price offers, calls, and inquiries regarding your animals.'}
            </CardDescription>
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              {isTelugu ? 'అన్నీ తొలగించు' : 'Clear all'}
            </Button>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          {!user ? (
            <div className="text-center py-12 text-muted-foreground space-y-3">
              <p>{isTelugu ? 'మీ నోటిఫికేషన్లు చూడటానికి దయచేసి లాగిన్ చేయండి.' : 'Please sign in to view your inquiries.'}</p>
              <Button asChild size="sm">
                <Link href="/login">{isTelugu ? 'లాగిన్ చేయండి' : 'Sign in'}</Link>
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground/60 mb-2">
                <Bell className="h-6 w-6" />
              </div>
              <p className="font-semibold text-foreground">
                {isTelugu ? 'ప్రస్తుతానికి కొత్త నోటిఫికేషన్లు ఏవీ లేవు' : 'No new notifications'}
              </p>
              <p className="text-xs max-w-sm mx-auto">
                {isTelugu
                  ? 'కొనుగోలుదారులు మీ పశువులపై ఆఫర్లు పంపినప్పుడు లేదా విచారణ చేసినప్పుడు ఇక్కడ కనిపిస్తాయి.'
                  : 'When buyers send price offers or inquire about your animals, they will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all ${
                    notif.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/30 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary flex-shrink-0" />
                        <h4 className="font-bold text-sm text-foreground">{notif.title}</h4>
                        {!notif.read && (
                          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug">{notif.message}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </span>
                        {notif.senderPhone && (
                          <a
                            href={`tel:${notif.senderPhone}`}
                            className="text-primary hover:underline font-semibold flex items-center gap-1"
                          >
                            <Phone className="h-3 w-3" />
                            {notif.senderPhone}
                          </a>
                        )}
                      </div>
                    </div>

                    {!notif.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 text-primary hover:bg-primary/10"
                        onClick={() => handleMarkRead(notif.id)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {isTelugu ? 'చదివాను' : 'Mark read'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
