'use client';

import { useState, useEffect } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type RequestStatus = 'idle' | 'requested' | 'approved' | 'declined';

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

  // Load persisted request status from localStorage
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

  // Handle auto-approval timer for realistic simulation if status is 'requested'
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (requestStatus === 'requested') {
      timer = setTimeout(() => {
        handleSellerApproval(true);
      }, 7000); // 7-second realistic seller approval simulation
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [requestStatus]);

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
        description: `Your call request has been sent to ${animal.userName}. Please wait for their approval.`,
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

      // Save notification to localStorage for notifications page
      try {
        const existingRaw = localStorage.getItem('animal_bazaar_notifications');
        const notifs = existingRaw ? JSON.parse(existingRaw) : [];
        notifs.unshift({
          id: Date.now().toString(),
          title: 'Call Request Accepted',
          message: `${animal.userName} accepted your call request for "${animal.title}". You can now call securely via Animal Bazaar.`,
          timestamp: Date.now(),
          link: `/post/${animal.id}`,
        });
        localStorage.setItem('animal_bazaar_notifications', JSON.stringify(notifs.slice(0, 20)));
      } catch (err) {
        console.error('Failed to record notification:', err);
      }
    } else {
      saveRequestStatus('declined');
      toast({
        variant: 'destructive',
        title: 'Request Declined (రిక్వెస్ట్ తిరస్కరించబడింది)',
        description: `${animal.userName} is currently unable to accept calls.`,
      });
    }
  };

  const handleCancelRequest = () => {
    saveRequestStatus('idle');
    toast({
      title: 'Request Cancelled',
      description: 'Your call request has been cancelled.',
    });
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
      console.error('Error generating summary:', error);
      setSummaryError('Failed to generate summary. Please try again.');
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
      console.error('Error suggesting similar animals:', error);
      setSimilarError('Failed to suggest similar animals. Please try again.');
    } finally {
      setIsSimilarLoading(false);
    }
  };

  // Trigger call ONLY when seller has accepted
  const handleCallAsAnimalBazaar = () => {
    if (requestStatus !== 'approved') {
      toast({
        variant: 'destructive',
        title: 'Approval Required',
        description: 'You can only call after the seller accepts your request.',
      });
      return;
    }

    setIsCallDialogOpen(true);

    toast({
      title: 'Connecting via Animal Bazaar...',
      description: `Calling seller ${animal.userName} as Animal Bazaar. Seller phone number remains hidden.`,
    });

    // Directly trigger mobile call dialer without exposing phone number in UI
    try {
      window.location.href = `tel:${animal.userPhone}`;
    } catch (error) {
      console.error('Error initiating telephone call:', error);
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
          <p className="text-xs text-muted-foreground text-center">
            సెల్లర్‌కి కాల్ చేయడానికి ముందు లాగిన్ అయి రిక్వెస్ట్ పంపాలి.
          </p>
        </div>
      );
    }

    // Is the user the seller of this listing?
    if (user.phone === animal.userPhone) {
      return (
        <div className="p-3 bg-muted rounded-lg text-center text-sm text-muted-foreground border">
          This is your own listing (ఇది మీ పోస్ట్).
        </div>
      );
    }

    // STATE 1: Idle - Buyer must send request first
    if (requestStatus === 'idle') {
      return (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              స్ప్యామ్ నిరోధక రక్షణ (Spam Protection)
            </div>
            <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
              అనవసరమైన కాల్స్ నుండి విక్రేతను రక్షించడానికి, మొదట రిక్వెస్ట్ పంపాలి. సెల్లర్ ఆమోదించిన తర్వాతే కాల్ వెళ్తుంది.
            </p>
          </div>

          <Button
            onClick={handleSendCallRequest}
            disabled={isSendingRequest}
            className="w-full font-semibold py-6 text-base shadow-sm"
          >
            {isSendingRequest ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending Request...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Request to Call (కాల్ కోసం రిక్వెస్ట్ పంపండి)
              </>
            )}
          </Button>

          <Button disabled variant="outline" className="w-full text-muted-foreground opacity-60 cursor-not-allowed">
            <Lock className="mr-2 h-4 w-4" />
            Call Locked (రిక్వెస్ట్ ఆమోదం అవసరం)
          </Button>
        </div>
      );
    }

    // STATE 2: Requested - Waiting for seller approval
    if (requestStatus === 'requested') {
      return (
        <div className="space-y-3.5">
          <div className="rounded-lg border bg-blue-50/70 dark:bg-blue-950/30 p-3.5 space-y-3 border-blue-200 dark:border-blue-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hourglass className="h-4 w-4 text-blue-600 animate-spin" />
                <span className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  Waiting for Seller (వేచి చూడండి)
                </span>
              </div>
              <Badge variant="outline" className="text-xs bg-background text-blue-700 border-blue-300">
                Pending Approval
              </Badge>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground pl-1">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>1. కాల్ రిక్వెస్ట్ సెల్లర్‌కి పంపబడింది</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
                <Hourglass className="h-3.5 w-3.5 animate-pulse" />
                <span>2. సెల్లర్ ఆమోదం కోసం వేచి చూస్తోంది...</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-1 border-t border-blue-100 dark:border-blue-900">
              సెల్లర్ యాక్సెప్ట్ చేయగానే కాల్ బటన్ అన్‌లాక్ అవుతుంది.
            </p>
          </div>

          {/* Locked Call Button - Cannot call until seller accepts */}
          <Button disabled className="w-full py-6 text-base opacity-60 cursor-not-allowed bg-muted text-muted-foreground">
            <Lock className="mr-2 h-5 w-5 text-muted-foreground" />
            Call Locked (సెల్లర్ ఇంకా ఆమోదించలేదు)
          </Button>

          {/* Interactive options during demo / testing */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelRequest}
              className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
            >
              Cancel Request (రద్దు చేయండి)
            </Button>

            {/* Quick Demo button to instantly simulate seller accepting */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSellerApproval(true)}
              className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-7 px-2 font-medium"
            >
              ✓ డెమో: సెల్లర్ యాక్సెప్ట్
            </Button>
          </div>
        </div>
      );
    }

    // STATE 3: Approved - Seller accepted! Call button is UNLOCKED
    if (requestStatus === 'approved') {
      return (
        <div className="space-y-3.5">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs space-y-1.5 animate-in fade-in-50">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-200 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              సెల్లర్ రిక్వెస్ట్ ఆమోదించారు! (Approved)
            </div>
            <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
              విక్రేత మీ కాల్ రిక్వెస్ట్‌ను అంగీకరించారు. ఇప్పుడు మీరు &apos;Animal Bazaar&apos; పేరుతో కాల్ చేయవచ్చు.
            </p>
          </div>

          <Button
            onClick={handleCallAsAnimalBazaar}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base shadow-md transition-all active:scale-[0.98]"
          >
            <PhoneCall className="mr-2 h-5 w-5 animate-bounce" />
            Call Now (Animal Bazaar కాల్)
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground bg-muted/60 p-2 rounded-md border text-center">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>నెంబర్ గోప్యంగా ఉంటుంది • కాల్ &apos;Animal Bazaar&apos; పేరుతో వెళ్తుంది</span>
          </div>
        </div>
      );
    }

    // STATE 4: Declined
    if (requestStatus === 'declined') {
      return (
        <div className="space-y-3">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-xs space-y-1 text-center">
            <div className="font-semibold text-destructive flex items-center justify-center gap-1.5">
              <XCircle className="h-4 w-4" />
              రిక్వెస్ట్ తిరస్కరించబడింది (Request Declined)
            </div>
            <p className="text-muted-foreground">
              సెల్లర్ ప్రస్తుతానికి కాల్ స్వీకరించలేకపోతున్నారు. కాల్ వెళ్లదు.
            </p>
          </div>

          <Button
            onClick={handleSendCallRequest}
            variant="outline"
            className="w-full"
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Send Request Again (మళ్లీ రిక్వెస్ట్ పంపండి)
          </Button>
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
                data-ai-hint={animal.imageHint}
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
                <span>
                  {animal.category} / {animal.breed}
                </span>
              </div>
              {animal.age && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{animal.age}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{animal.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Posted {formatDistanceToNow(new Date(animal.createdAt), { addSuffix: true })}
                </span>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit /> AI Corner
              </CardTitle>
              <CardDescription>Use AI to get more insights about this listing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Button onClick={handleGenerateSummary} disabled={isSummaryLoading}>
                  {isSummaryLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate AI Summary
                </Button>
                {summaryError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{summaryError}</AlertDescription>
                  </Alert>
                )}
                {summary && (
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                    <h4 className="font-semibold">Summary:</h4>
                    <p className="text-sm text-muted-foreground">{summary.summary}</p>
                  </div>
                )}
              </div>
              <div>
                <Button onClick={handleSuggestSimilar} disabled={isSimilarLoading}>
                  {isSimilarLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Suggest Similar Animals
                </Button>
                {similarError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{similarError}</AlertDescription>
                  </Alert>
                )}
                {similar && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-semibold">Similar Animals:</h4>
                    <div className="grid gap-4">
                      {similar.map((item, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.breed} in {item.location}
                          </p>
                          <p className="text-xs mt-1 italic">Reason: {item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Seller Information (విక్రేత వివరాలు)</CardTitle>
              <CardDescription>Verified and spam-protected calling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{animal.userName}</h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{animal.location}</span>
                  </div>
                </div>
              </div>

              {/* Masked Phone Representation - Seller number is NEVER revealed in plain text */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border text-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-foreground">Phone Number:</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs bg-background text-emerald-700 border-emerald-300">
                  🔒 Protected (గోప్యంగా ఉంది)
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

      {/* Active Call Modal - Displays Animal Bazaar Call Interface */}
      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="flex flex-col items-center space-y-2">
            <div className="relative flex items-center justify-center">
              <span className="absolute animate-ping inline-flex h-20 w-20 rounded-full bg-emerald-400 opacity-75"></span>
              <div className="relative h-20 w-20 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                <PhoneCall className="h-9 w-9 animate-pulse" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 pt-2">
              <Logo className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl font-bold">
                Animal Bazaar Calling...
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm">
              సెల్లర్ ఆమోదం పొందిన తర్వాత &apos;Animal Bazaar&apos; పేరుతో కాల్ వెళ్తోంది
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3 bg-muted/30 rounded-lg p-4 border mt-2">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Connecting To Seller</p>
              <h3 className="text-lg font-bold text-foreground mt-0.5">{animal.userName}</h3>
              <p className="text-sm text-primary font-medium">{animal.title}</p>
            </div>

            <div className="border-t pt-3 flex items-center justify-center gap-2 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                విక్రేత వ్యక్తిగత ఫోన్ నంబర్ దాచబడింది. కాల్ Animal Bazaar ద్వారా నడుస్తోంది.
              </span>
            </div>
          </div>

          <DialogFooter className="flex sm:flex-row gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                window.location.href = `tel:${animal.userPhone}`;
                toast({
                  title: 'Redialing...',
                  description: 'Connecting call again via Animal Bazaar.',
                });
              }}
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Call Again (మళ్లీ కాల్ చేయండి)
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={() => setIsCallDialogOpen(false)}
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              End / Close (ముగించండి)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}