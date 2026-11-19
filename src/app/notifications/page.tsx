'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, CheckCircle2, PhoneCall, Trash2, Tag, Calendar, ShieldCheck, Check, X, ArrowRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  getStoredNotifications,
  markNotificationRead,
  getCallRequests,
  respondToCallRequest,
  SYNC_EVENT_NAME,
} from '@/lib/animals';
import type { NotificationItem, CallRequest } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function NotificationsPage() {
  const { user, language } = useAuth();
  const { toast } = useToast();
  const isTelugu = language === 'te';
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [callRequestsById, setCallRequestsById] = useState<Record<string, CallRequest>>({});

  const syncData = useCallback(() => {
    if (!user) {
      setNotifications([]);
      setCallRequestsById({});
      return;
    }
    const list = getStoredNotifications(user.uid);
    setNotifications(list);

    const allReqs = getCallRequests();
    const map: Record<string, CallRequest> = {};
    allReqs.forEach((r) => {
      map[r.id] = r;
    });
    setCallRequestsById(map);
  }, [user]);

  useEffect(() => {
    syncData();
    window.addEventListener(SYNC_EVENT_NAME, syncData);
    window.addEventListener('storage', syncData);
    const poll = setInterval(syncData, 1500);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, syncData);
      window.removeEventListener('storage', syncData);
      clearInterval(poll);
    };
  }, [syncData]);

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    syncData();
  };

  const handleCallRequestDecision = (requestId: string, decision: 'accepted' | 'rejected') => {
    const updated = respondToCallRequest(requestId, decision);
    if (updated) {
      toast({
        title:
          decision === 'accepted'
            ? (isTelugu ? 'కాల్ రిక్వెస్ట్ ఆమోదించబడింది ✓' : 'Call Request Accepted ✓')
            : (isTelugu ? 'కాల్ రిక్వెస్ట్ తిరస్కరించబడింది' : 'Call Request Declined'),
        description:
          decision === 'accepted'
            ? (isTelugu
                ? 'ఇప్పుడు కొనుగోలుదారు Animal Bazaar పేరుతో మీకు కాల్ చేయగలరు. ఇద్దరి నంబర్లు దాచబడ్డాయి.'
                : 'Buyer can now connect via Animal Bazaar masked call. Phone numbers remain hidden.')
            : (isTelugu ? 'కొనుగోలుదారుకు సమాచారం పంపబడింది.' : 'Buyer has been notified via Animal Bazaar.'),
      });
      syncData();
    }
  };

  const handleClearAll = () => {
    if (typeof window !== 'undefined' && user) {
      const all = getStoredNotifications();
      const remaining = all.filter((n) => n.userId !== user.uid);
      localStorage.setItem('animal_bazaar_notifications', JSON.stringify(remaining));
      window.dispatchEvent(new Event(SYNC_EVENT_NAME));
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
              {isTelugu ? 'నోటిఫికేషన్లు & కాల్ రిక్వెస్ట్‌లు' : 'Notifications & Call Requests'}
            </CardTitle>
            <CardDescription>
              {isTelugu
                ? 'అన్ని కాల్స్ మరియు ఆఫర్లు Animal Bazaar ద్వారా నంబర్ దాచి వస్తాయి.'
                : 'All call requests & offers arrive privately through Animal Bazaar.'}
            </CardDescription>
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              {isTelugu ? 'అన్నీ తొలగించు' : 'Clear all'}
            </Button>
          )}
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>
              {isTelugu
                ? 'గోప్యతా రక్షణ: మీ ఫోన్ నంబర్ గాని, ఇతరుల ఫోన్ నంబర్ గాని ఎక్కడా చూపబడదు — కేవలం Animal Bazaar అని మాత్రమే కనిపిస్తుంది.'
                : 'Privacy Shield: No personal phone numbers are ever shared. Both parties only see Animal Bazaar.'}
            </span>
          </div>

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
                  ? 'కొనుగోలుదారులు కాల్ రిక్వెస్ట్ లేదా ధర ఆఫర్ పంపినప్పుడు ఇక్కడ కనిపిస్తాయి.'
                  : 'When buyers send call requests or offers via Animal Bazaar, they appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => {
                const relatedReq = notif.callRequestId ? callRequestsById[notif.callRequestId] : undefined;
                const isCallRequest = notif.type === 'call_request' && notif.callRequestId;

                return (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-xl border transition-all ${
                      notif.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/30 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {isCallRequest ? (
                            <PhoneCall className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <Tag className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                          <h4 className="font-bold text-sm text-foreground">{notif.title}</h4>
                          {!notif.read && (
                            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              NEW
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground leading-snug">{notif.message}</p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="h-3 w-3" />
                            Animal Bazaar
                          </span>
                        </div>

                        {/* Seller Action Buttons for Call Requests */}
                        {isCallRequest && notif.callRequestId && (
                          <div className="pt-2.5 flex flex-wrap items-center gap-2">
                            {!relatedReq || relatedReq.status === 'pending' ? (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                  onClick={() => handleCallRequestDecision(notif.callRequestId!, 'accepted')}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  {isTelugu ? 'ఆమోదించు (Accept Call)' : 'Accept Request'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleCallRequestDecision(notif.callRequestId!, 'rejected')}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  {isTelugu ? 'తిరస్కరించు (Reject)' : 'Reject'}
                                </Button>
                              </>
                            ) : relatedReq.status === 'accepted' ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold py-1 px-2.5">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                {isTelugu
                                  ? 'ఆమోదించబడింది ✓ (Animal Bazaar కాల్‌కు సిద్ధం)'
                                  : 'Accepted ✓ (Masked Call Enabled)'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 font-semibold py-1 px-2.5">
                                <X className="w-3.5 h-3.5 mr-1" />
                                {isTelugu ? 'తిరస్కరించబడింది' : 'Declined'}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Quick link back to listing when Buyer gets Call Accepted */}
                        {notif.type === 'call_accepted' && notif.animalId && (
                          <div className="pt-2">
                            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                              <Link href={`/post/${notif.animalId}`}>
                                <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
                                {isTelugu ? 'ఇప్పుడే కాల్ చేయండి (Call Seller Now)' : 'Go to Listing & Call Seller Now'}
                                <ArrowRight className="w-3.5 h-3.5 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>

                      {!notif.read && !isCallRequest && (
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

