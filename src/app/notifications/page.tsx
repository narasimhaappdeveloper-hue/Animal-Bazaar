'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, CheckCircle2, PhoneCall, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  link?: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('animal_bazaar_notifications');
      if (raw) {
        setNotifications(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Failed to read notifications from localStorage:', e);
    }
  }, []);

  const handleClear = () => {
    try {
      localStorage.removeItem('animal_bazaar_notifications');
      setNotifications([]);
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications (నోటిఫికేషన్‌లు)
            </CardTitle>
            <CardDescription>
              Updates regarding your animal listings and call requests
            </CardDescription>
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Bell className="h-10 w-10 mx-auto text-muted mb-2 stroke-1" />
              <p className="font-medium text-foreground">No new notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                You will receive alerts here when sellers accept your call requests.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3.5 rounded-lg border bg-muted/30 transition-all hover:bg-muted/50"
                >
                  <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.message}</p>
                    {item.link && (
                      <div className="pt-1.5">
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs bg-background">
                          <Link href={item.link}>
                            <PhoneCall className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                            View & Call Seller
                          </Link>
                        </Button>
                      </div>
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
