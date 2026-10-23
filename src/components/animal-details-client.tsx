'use client';

import { useState, useEffect, useRef } from 'react';
import type { Animal } from '@/lib/definitions';
import { summarizeAnimalListing, SummarizeAnimalListingOutput } from '@/ai/flows/summarize-animal-listing';
import { suggestSimilarAnimals, SuggestSimilarAnimalsOutput } from '@/ai/flows/suggest-similar-animals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { AnimalIcon } from './animal-icon';
import { Logo } from './icons/logo';
import {
  MapPin,
  Calendar,
  User,
  BrainCircuit,
  Sparkles,
  Loader2,
  AlertTriangle,
  LogIn,
  Clock,
  ShieldCheck,
  PhoneCall,
  PhoneOff,
  RotateCw,
  Send,
  CheckCircle2,
  Hourglass,
  Lock,
  XCircle,
  ShieldAlert,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

type RequestStatus = 'idle' | 'requested' | 'approved' | 'declined';
type CallState = 'ringing' | 'connected' | 'ended';

export default function AnimalDetailsClient({ animal }: { animal: Animal }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [summary, setSummary] = useState<SummarizeAnimalListingOutput | null>(null);
  const [similar, setSimilar] = useState<SuggestSimilarAnimalsOutput | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isSimilarLoading, setIsSimilarLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [similarError, setSimilarError] = useState<string | null>(null);

  // Calling & Request states
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  // In-App Dialer states
  const [callState, setCallState] = useState<CallState>('ringing');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const savedStatus = localStorage.getItem(`call_req_${animal.id}`) as RequestStatus | null;
      if (savedStatus && ['requested', 'approved', 'declined'].includes(savedStatus)) {
        setRequestStatus(savedStatus);
      }
    } catch (error) {
      console.error('Failed to read request status from localStorage:', error);
    }
  }, [animal.id]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (requestStatus === 'requested') {
      timer = setTimeout(() => {
        handleSellerApproval(true);
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [requestStatus]);

  // Handle Call Timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const saveRequestStatus = (status: RequestStatus) => {
    setRequestStatus(status);
    try {
      localStorage.setItem(`call_req_${animal.id}`, status);
    } catch (error) {
      console.error('Failed to save request status to localStorage:', error);
    }
  };

  const handleSendCallRequest = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login Required (లాగిన్ అవ్వండి)',
        description: 'Please login to send a call request to the seller.',
      });
      return;
    }

    setIsSendingRequest(true);
    setTimeout(() => {
      saveRequestStatus('requested');
      setIsSendingRequest(false);
      toast({
        title: 'Call Request Sent (రిక్వెస్ట్ పంపబడింది)',
        description: `Your call request has been sent to ${animal.userName}. Please wait for approval.`,
      });
    }, 600);
  };

  const handleSellerApproval = (approved: boolean) => {
    if (approved) {
      saveRequestStatus('approved');
      toast({
        title: 'Request Approved! (సెల్లర్ అంగీకరించారు ✓)',
        description: `${animal.userName} accepted your call request. You can now call via Animal Bazaar!`,
      });
    } else {
      saveRequestStatus('declined');
      toast({
        variant: 'destructive',
        title: 'Request Declined',
        description: `${animal.userName} is currently unable to accept calls.`,
      });
    }
  };

  // Launch Animal Bazaar Dialer Screen (No real SIM dialer, No real number)
  const handleStartAnimalBazaarDialer = () => {
    if (requestStatus !== 'approved') {
      toast({
        variant: 'destructive',
        title: 'Approval Required',
        description: 'You can only call after the seller accepts your request.',
      });
      return;
    }

    setIsCallDialogOpen(true);
    setCallState('ringing');
    setCallDuration(0);

    // Simulate connection after 3.5 seconds
    setTimeout(() => {
      setCallState('connected');
    }, 3500);
  };

  const handleEndCall = () => {
    setCallState('ended');
    setTimeout(() => {
      setIsCallDialogOpen(false);
      setCallState('ringing');
      setCallDuration(0);
    }, 800);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerateSummary = async () => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    try {
      const result = await summarizeAnimalListing({
        title: animal.title,
        breed: animal.breed,
        price: animal.price,
        location: animal.location,
        desc: animal.desc,
      });
      setSummary(result);
    } catch (error) {
      console.error(error);
      setSummaryError('Failed to generate summary.');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleSuggestSimilar = async () => {
    setIsSimilarLoading(true);
    setSimilarError(null);
    try {
      const result = await suggestSimilarAnimals({
        category: animal.category,
        breed: animal.breed,
        location: animal.location,
        title: animal.title,
        desc: animal.desc,
      });
      setSimilar(result);
    } catch (error) {
      console.error(error);
      setSimilarError('Failed to suggest similar animals.');
    } finally {
      setIsSimilarLoading(false);
    }
  };

  const renderContactAction = () => {
    if (animal.status !== 'active') {
      return (
        <Badge variant="destructive" className="w-full text-center justify-center py-2.5 text-base font-semibold">
          SOLD (విక్రయించబడింది)
        </Badge>
      );
    }

    if (!user) {
      return (
        <div className="space-y-3">
          <Button asChild className="w-full" variant="outline">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Login to Request Call (లాగిన్ అవ్వండి)
            </Link>
          </Button>
        </div>
      );
    }

    if (user.phone === animal.userPhone) {
      return (
        <div className="p-3 bg-muted rounded-lg text-center text-sm text-muted-foreground border">
          This is your own listing (ఇది మీ పోస్ట్).
        </div>
      );
    }

    if (requestStatus === 'idle') {
      return (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              నంబర్ ప్రొటెక్షన్ (Number Masking)
            </div>
            <p className="text-amber-700 dark:text-amber-300">
              సెల్లర్ నంబర్ కనిపించదు. కేవలం &apos;Animal Bazaar&apos; డయలర్ ద్వారా మాత్రమే కాల్ వెళ్తుంది.
            </p>
          </div>

          <Button
            onClick={handleSendCallRequest}
            disabled={isSendingRequest}
            className="w-full font-semibold py-6 text-base"
          >
            {isSendingRequest ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                రిక్వెస్ట్ వెళ్తోంది...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Request to Call (కాల్ రిక్వెస్ట్ చేయండి)
              </>
            )}
          </Button>
        </div>
      );
    }

    if (requestStatus === 'requested') {
      return (
        <div className="space-y-3.5">
          <div className="rounded-lg border bg-blue-50/70 p-3.5 space-y-2 border-blue-200 text-xs">
            <div className="flex items-center gap-2 text-blue-900 font-semibold">
              <Hourglass className="h-4 w-4 animate-spin text-blue-600" />
              సెల్లర్ అనుమతి కోసం వేచి చూస్తోంది...
            </div>
            <p className="text-muted-foreground">సెల్లర్ అంగీకరించగానే Animal Bazaar కాల్ బటన్ వస్తుంది.</p>
          </div>
          <Button disabled className="w-full py-6 text-base opacity-60 bg-muted text-muted-foreground">
            <Lock className="mr-2 h-5 w-5" />
            లాక్ చేయబడింది
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSellerApproval(true)}
            className="w-full text-xs text-emerald-700 border-emerald-300"
          >
            ✓ డెమో: సెల్లర్ యాక్సెప్ట్ చేయండి
          </Button>
        </div>
      );
    }

    if (requestStatus === 'approved') {
      return (
        <div className="space-y-3">
          <Button
            onClick={handleStartAnimalBazaarDialer}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base shadow-lg"
          >
            <PhoneCall className="mr-2 h-5 w-5 animate-bounce" />
            Call (Animal Bazaar)
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>డయలర్‌లో కేవలం &apos;Animal Bazaar&apos; మాత్రమే కనిపిస్తుంది</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card className="overflow-hidden">
            <CardHeader className="p-0">
              <Image
                src={animal.imageUrl}
                alt={animal.title}
                width={800}
                height={600}
                className="w-full object-cover"
                priority
              />
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <h1 className="text-3xl font-bold">{animal.title}</h1>
              <div className="text-2xl font-semibold text-primary">{formatPrice(animal.price)}</div>
              <p className="text-muted-foreground">{animal.desc}</p>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <AnimalIcon category={animal.category} className="h-4 w-4" />
                <span>{animal.category} / {animal.breed}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{animal.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Posted {formatDistanceToNow(new Date(animal.createdAt), { addSuffix: true })}</span>
              </div>
            </CardFooter>
          </Card>

          {/* AI Corner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit /> AI Corner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleGenerateSummary} disabled={isSummaryLoading}>
                {isSummaryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Sparkles className="mr-2 h-4 w-4" /> AI Summary
              </Button>
              {summary && (
                <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                  {summary.summary}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Seller Information</CardTitle>
              <CardDescription>Protected Animal Bazaar Calling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold">{animal.userName}</h4>
                  <span className="text-xs text-muted-foreground">{animal.location}</span>
                </div>
              </div>

              {/* Number Masked UI */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border text-sm">
                <span className="font-medium">Caller ID:</span>
                <Badge variant="outline" className="font-semibold text-emerald-700 bg-emerald-50 border-emerald-300">
                  Animal Bazaar
                </Badge>
              </div>

              {renderContactAction()}
            </CardContent>
          </Card>

          <Button variant="outline" asChild className="w-full">
            <Link href="/">⬅ Back to all animals</Link>
          </Button>
        </div>
      </div>

      {/* FULL IN-APP ANIMAL BAZAAR DIALER SCREEN */}
      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent className="sm:max-w-xs p-0 overflow-hidden border-none rounded-3xl bg-slate-950 text-white shadow-2xl">
          <div className="flex flex-col items-center justify-between min-h-[520px] p-6 text-center">
            
            {/* Caller Identification - Shows ONLY Animal Bazaar */}
            <div className="pt-8 space-y-2">
              <div className="inline-flex p-3 bg-emerald-500/20 rounded-full text-emerald-400 mb-2">
                <Logo className="h-8 w-8 text-emerald-400" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-wide text-white">
                Animal Bazaar
              </DialogTitle>
              <p className="text-xs text-emerald-400 font-medium tracking-widest uppercase">
                {callState === 'ringing' && 'కాలింగ్ అవుతోంది... (Ringing)'}
                {callState === 'connected' && `కాల్ కనెక్ట్ అయ్యింది (${formatTimer(callDuration)})`}
                {callState === 'ended' && 'కాల్ ముగిసింది (Call Ended)'}
              </p>
              <p className="text-xs text-slate-400 pt-1">
                సురక్షిత డయలర్ • నెంబర్ పూర్తిగా దాచబడింది
              </p>
            </div>

            {/* Profile Graphic */}
            <div className="relative my-6">
              <div className={`h-28 w-28 rounded-full border-2 border-emerald-500/40 flex items-center justify-center bg-slate-900 shadow-inner ${callState === 'ringing' ? 'animate-pulse' : ''}`}>
                <User className="h-14 w-14 text-slate-400" />
              </div>
              {callState === 'connected' && (
                <span className="absolute bottom-1 right-2 h-4 w-4 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
              )}
            </div>

            {/* In-Call Controls */}
            <div className="w-full space-y-6 pb-4">
              <div className="grid grid-cols-2 gap-4 px-6">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${isMuted ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-900 text-slate-300'}`}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  <span className="text-[11px]">{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                <button
                  type="button"
                  className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all"
                >
                  <Volume2 className="h-5 w-5" />
                  <span className="text-[11px]">Speaker</span>
                </button>
              </div>

              {/* End Call Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-90 text-white flex items-center justify-center shadow-lg transition-transform"
                >
                  <PhoneOff className="h-7 w-7" />
                </button>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
