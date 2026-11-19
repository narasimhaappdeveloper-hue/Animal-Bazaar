'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Animal, CallRequest } from '@/lib/definitions';
import { summarizeAnimalListing, SummarizeAnimalListingOutput } from '@/ai/flows/summarize-animal-listing';
import { suggestSimilarAnimals, SuggestSimilarAnimalsOutput } from '@/ai/flows/suggest-similar-animals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { AnimalIcon } from './animal-icon';
import {
  MapPin,
  Phone,
  Share2,
  Heart,
  BrainCircuit,
  Sparkles,
  Loader2,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle2,
  ArrowLeft,
  Lock,
  BellRing,
  XCircle,
  LogIn,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  toggleFavorite,
  getFavorites,
  addNotification,
  getCallRequestForBuyerAndAnimal,
  createCallRequest,
  startMaskedCall,
  SYNC_EVENT_NAME,
} from '@/lib/animals';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

export default function AnimalDetailsClient({ animal }: { animal: Animal }) {
  const { toast } = useToast();
  const { user, language } = useAuth();
  const isTelugu = language === 'te';

  const [summary, setSummary] = useState<SummarizeAnimalListingOutput | null>(null);
  const [similar, setSimilar] = useState<SuggestSimilarAnimalsOutput | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isSimilarLoading, setIsSimilarLoading] = useState(false);

  const [isFav, setIsFav] = useState(false);
  const fallbackImage = 'https://images.unsplash.com/photo-1695902878213-f555035ac175?auto=format&fit=crop&w=800&q=80';
  const [imgSrc, setImgSrc] = useState(animal.imageUrl);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState(String(Math.round(animal.price * 0.9)));
  const [offerNote, setOfferNote] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  const [callRequest, setCallRequest] = useState<CallRequest | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  useEffect(() => {
    setImgSrc(animal.imageUrl);
  }, [animal.imageUrl]);

  const syncCallRequest = useCallback(() => {
    if (!user) {
      setCallRequest(null);
      return;
    }
    const existing = getCallRequestForBuyerAndAnimal(user.uid, animal.id);
    setCallRequest(existing);
  }, [user, animal.id]);

  useEffect(() => {
    const favs = getFavorites();
    setIsFav(favs.includes(animal.id));
  }, [animal.id]);

  useEffect(() => {
    syncCallRequest();
    window.addEventListener(SYNC_EVENT_NAME, syncCallRequest);
    window.addEventListener('storage', syncCallRequest);
    const poll = setInterval(syncCallRequest, 1500);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, syncCallRequest);
      window.removeEventListener('storage', syncCallRequest);
      clearInterval(poll);
    };
  }, [syncCallRequest]);

  const handleToggleFav = () => {
    const nowFav = toggleFavorite(animal.id);
    setIsFav(nowFav);
    toast({
      title: nowFav
        ? (isTelugu ? 'ఇష్టమైన వాటిలో చేర్చబడింది' : 'Added to Wishlist')
        : (isTelugu ? 'ఇష్టమైన వాటి నుండి తీసివేయబడింది' : 'Removed from Wishlist'),
      description: animal.title,
    });
  };

  const handleGenerateSummary = async () => {
    setIsSummaryLoading(true);
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
      setSummary({
        summary: isTelugu
          ? `ఈ పశువు (${animal.breed} ${animal.category}) ${animal.location} లో అమ్మకానికి ఉంది. నిర్ణయించిన ధర ₹${animal.price.toLocaleString('en-IN')}. ఆరోగ్యకరమైన నాణ్యమైన పశువుగా సూచించబడింది.`
          : `This ${animal.breed} ${animal.category} is listed in ${animal.location} for ₹${animal.price.toLocaleString('en-IN')}. Good quality listing verified by seller.`,
        suggestedItems: [],
      });
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleSuggestSimilar = async () => {
    setIsSimilarLoading(true);
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
      setSimilar([
        {
          title: `Pure ${animal.breed} in ${animal.location}`,
          breed: animal.breed,
          location: animal.location,
          reason: isTelugu ? 'అదే జాతి మరియు సమీప ప్రాంతం' : 'Similar breed in nearby district',
        },
      ]);
    } finally {
      setIsSimilarLoading(false);
    }
  };

  const handleSendCallRequest = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'లాగిన్ అవ్వండి' : 'Login Required',
        description: isTelugu
          ? 'కాల్ రిక్వెస్ట్ పంపడానికి దయచేసి లాగిన్ అవ్వండి.'
          : 'Please login to send a call request.',
      });
      return;
    }

    setIsSendingRequest(true);
    const req = createCallRequest({
      animal,
      buyerUid: user.uid,
    });
    setCallRequest(req);
    setIsSendingRequest(false);

    toast({
      title: isTelugu ? 'కాల్ రిక్వెస్ట్ పంపబడింది!' : 'Call Request Sent!',
      description: isTelugu
        ? 'రైతు మీ రిక్వెస్ట్‌ను ఆమోదించిన తర్వాతే Call Seller Now బటన్ ఆక్టివేట్ అవుతుంది.'
        : 'Call Seller Now will activate once the seller accepts your request.',
    });
  };

  const handleMaskedCallSeller = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'లాగిన్ అవ్వండి' : 'Login Required',
        description: isTelugu ? 'కాల్ చేయడానికి లాగిన్ అవ్వండి.' : 'Please login first.',
      });
      return;
    }

    if (!callRequest || callRequest.status !== 'accepted') {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'ముందుగా కాల్ రిక్వెస్ట్ పంపండి' : 'Seller Approval Required',
        description: isTelugu
          ? 'రైతు మీ రిక్వెస్ట్ ఆమోదించిన తర్వాతే కాల్ చేయగలరు.'
          : 'You must send a call request and wait for seller acceptance first.',
      });
      return;
    }

    startMaskedCall({
      requestId: callRequest.id,
      animalId: animal.id,
      animalTitle: animal.title,
      callerUid: user.uid,
      calleeUid: animal.uid,
    });

    toast({
      title: isTelugu ? 'Animal Bazaar కాల్ కనెక్ట్ అవుతోంది' : 'Connecting via Animal Bazaar',
      description: isTelugu
        ? 'ఇద్దరి ఫోన్ నంబర్లు దాచబడ్డాయి — Animal Bazaar పేరుతో మాత్రమే కాల్ కనెక్ట్ అవుతుంది.'
        : 'Phone numbers are hidden. Connecting as Animal Bazaar.',
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${animal.title} - Animal Bazaar`,
          text: `${animal.title} for ${formatPrice(animal.price)} in ${animal.location}`,
          url: url,
        });
        return;
      } catch (err) {
        console.error('Share cancelled or failed:', err);
      }
    }
    navigator.clipboard.writeText(url);
    toast({
      title: isTelugu ? 'లింక్ కాపీ చేయబడింది' : 'Link Copied',
      description: isTelugu ? 'లింక్ క్లిప్‌బోర్డ్‌కి కాపీ అయింది.' : 'Listing link copied to clipboard.',
    });
  };

  const handleSendOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'లాగిన్ అవ్వండి' : 'Login Required',
        description: isTelugu ? 'ఆఫర్ పంపడానికి దయచేసి లాగిన్ చేయండి.' : 'Please login to send an offer to the seller.',
      });
      return;
    }

    setIsSubmittingOffer(true);
    const amount = Number(offerPrice);

    // Save privacy-masked notification for seller (NEVER reveal buyer phone number)
    addNotification({
      id: 'notif_' + Date.now().toString(),
      userId: animal.uid,
      title: isTelugu ? `Animal Bazaar — కొత్త ఆఫర్: ₹${amount.toLocaleString('en-IN')}` : `Animal Bazaar — New Offer: ₹${amount.toLocaleString('en-IN')}`,
      message: isTelugu
        ? `'${animal.title}' కోసం Animal Bazaar ద్వారా ₹${amount.toLocaleString('en-IN')} ఆఫర్ వచ్చింది. సందేశం: "${offerNote || 'కొనుగోలు చేయడానికి ఆసక్తిగా ఉన్నాను'}"`
        : `Animal Bazaar buyer sent an offer for '${animal.title}': ₹${amount.toLocaleString('en-IN')}. Note: "${offerNote || 'Interested in buying'}"`,
      type: 'offer',
      createdAt: Date.now(),
      read: false,
      animalId: animal.id,
      senderName: 'Animal Bazaar',
      offerAmount: amount,
    });

    setIsSubmittingOffer(false);
    setIsOfferDialogOpen(false);
    toast({
      title: isTelugu ? 'ఆఫర్ పంపబడింది!' : 'Offer Sent via Animal Bazaar!',
      description: isTelugu
        ? 'మీ ఫోన్ నంబర్ గోప్యంగా ఉంచి Animal Bazaar ద్వారా మీ ఆఫర్ రైతుకు పంపబడింది.'
        : 'Your offer was sent privately through Animal Bazaar without revealing your phone number.',
    });
  };

  const isOwnListing = Boolean(user && user.uid === animal.uid);
  const isCallAccepted = callRequest?.status === 'accepted';
  const isCallPending = callRequest?.status === 'pending';
  const isCallRejected = callRequest?.status === 'rejected';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild size="sm">
          <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {isTelugu ? 'అన్ని పశువుల జాబితాకు తిరిగి వెళ్లు' : 'Back to all animals'}
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleFav}
            className={`border-muted ${isFav ? 'text-red-500 hover:text-red-600 bg-red-50' : ''}`}
          >
            <Heart className={`h-4 w-4 mr-1.5 ${isFav ? 'fill-red-500' : ''}`} />
            {isFav ? (isTelugu ? 'ఇష్టమైనది' : 'Saved') : (isTelugu ? 'ఇష్టపడు' : 'Save')}
          </Button>

          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1.5" />
            {isTelugu ? 'షేర్ చేయి' : 'Share'}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Animal Content */}
        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden shadow-md border-border/80">
            <div className="relative aspect-[16/10] w-full bg-muted overflow-hidden">
              <Image
                src={imgSrc}
                alt={animal.title}
                fill
                priority
                className="object-cover"
                data-ai-hint={animal.imageHint}
                referrerPolicy="no-referrer"
                onError={() => {
                  if (imgSrc !== fallbackImage) {
                    setImgSrc(fallbackImage);
                  }
                }}
              />
              {animal.status === 'closed' ? (
                <Badge variant="destructive" className="absolute top-4 left-4 text-base px-3 py-1 font-bold">
                  {isTelugu ? 'అమ్మబడింది (SOLD)' : 'SOLD'}
                </Badge>
              ) : (
                <Badge className="absolute top-4 left-4 bg-emerald-600 text-white text-sm px-3 py-1 font-semibold">
                  {isTelugu ? 'అమ్మకానికి సిద్ధం' : 'Active Listing'}
                </Badge>
              )}

              {/* Live Call Request Status Pill on Detail Hero */}
              {animal.status !== 'closed' && user && !isOwnListing && (
                <div className="absolute top-4 right-4 z-10">
                  {isCallAccepted ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-950/90 border border-emerald-400/80 px-3 py-1.5 text-xs font-bold text-emerald-100 shadow-lg backdrop-blur-sm">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                      </span>
                      {isTelugu ? 'కాల్ ఆమోదించబడింది ✓' : 'Call Request Accepted ✓'}
                    </span>
                  ) : isCallPending ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-950/90 border border-amber-400/80 px-3 py-1.5 text-xs font-bold text-amber-100 shadow-lg backdrop-blur-sm">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                      </span>
                      {isTelugu ? 'కాల్ రిక్వెస్ట్ పెండింగ్...' : 'Call Request Pending...'}
                    </span>
                  ) : isCallRejected ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950/90 border border-red-400/80 px-3 py-1.5 text-xs font-bold text-red-100 shadow-lg backdrop-blur-sm">
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                      {isTelugu ? 'కాల్ రిక్వెస్ట్ తిరస్కరించబడింది' : 'Call Request Rejected'}
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{animal.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{animal.location}</span>
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-primary">{formatPrice(animal.price)}</div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-base">{isTelugu ? 'పశువు వివరాలు' : 'Description'}</h3>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-base">{animal.desc}</p>
              </div>

              {/* Attributes badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">{isTelugu ? 'రకం' : 'Category'}</div>
                  <div className="font-bold flex items-center gap-1.5 mt-0.5">
                    <AnimalIcon category={animal.category} className="h-4 w-4 text-primary" />
                    {animal.category}
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">{isTelugu ? 'జాతి' : 'Breed'}</div>
                  <div className="font-bold mt-0.5">{animal.breed}</div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">{isTelugu ? 'వయస్సు' : 'Age'}</div>
                  <div className="font-bold mt-0.5">{animal.age || 'Not specified'}</div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">{isTelugu ? 'పోస్ట్ తేదీ' : 'Posted'}</div>
                  <div className="font-bold mt-0.5">
                    {formatDistanceToNow(new Date(animal.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Helper Corner */}
          <Card className="shadow-sm border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-primary font-bold">
                <BrainCircuit className="h-5 w-5" />
                {isTelugu ? 'AI స్మార్ట్ విశ్లేషణ (AI Assistant)' : 'AI Smart Insights'}
              </CardTitle>
              <CardDescription>
                {isTelugu
                  ? 'ఈ పశువు విలువ, సమాచారం మరియు సారూప్య పశువుల సలహాలను పొందండి.'
                  : 'AI powered listing summary & similar livestock suggestions.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleGenerateSummary} disabled={isSummaryLoading} variant="outline" size="sm">
                  {isSummaryLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  )}
                  {isTelugu ? 'AI సారాంశం పొందండి' : 'Generate AI Summary'}
                </Button>

                <Button onClick={handleSuggestSimilar} disabled={isSimilarLoading} variant="outline" size="sm">
                  {isSimilarLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  )}
                  {isTelugu ? 'సారూప్య పశువులను చూడండి' : 'Suggest Similar Animals'}
                </Button>
              </div>

              {summary && (
                <div className="p-4 bg-muted/60 border border-primary/20 rounded-lg space-y-1.5">
                  <h4 className="font-semibold text-sm text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    {isTelugu ? 'పశువు సారాంశం:' : 'Listing Summary:'}
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed">{summary.summary}</p>
                </div>
              )}

              {similar && (
                <div className="space-y-2 pt-2">
                  <h4 className="font-semibold text-sm">{isTelugu ? 'సిఫార్సు చేయబడిన పశువులు:' : 'Similar Matches:'}</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {similar.map((item, index) => (
                      <div key={index} className="p-3 bg-muted/60 rounded-lg border text-sm">
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.breed} • {item.location}</p>
                        <p className="text-xs text-primary mt-1 italic">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Privacy-Protected Contact Actions (Zero Phone Exposure) */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-md border-primary/20 sticky top-20">
            <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {animal.userName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg font-bold flex items-center gap-1.5">
                    {animal.userName}
                  </CardTitle>
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {isTelugu ? 'ధ్రువీకరించబడిన రైతు' : 'Verified Seller'}
                  </p>
                </div>
              </div>

              {/* Persistent Call Request Status Chip */}
              {animal.status !== 'closed' && user && !isOwnListing && (
                <div className="flex items-center justify-between rounded-lg bg-background/80 border px-3 py-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {isTelugu ? 'కాల్ స్థితి (Status)' : 'Call Status'}
                  </span>
                  {isCallAccepted ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                      </span>
                      {isTelugu ? 'ఆమోదించబడింది (Active)' : 'Accepted • Active'}
                    </span>
                  ) : isCallPending ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
                      </span>
                      {isTelugu ? 'పెండింగ్‌లో ఉంది (Pending)' : 'Pending Approval'}
                    </span>
                  ) : isCallRejected ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 border border-red-300 px-2.5 py-0.5 text-xs font-bold text-red-800">
                      <span className="inline-flex rounded-full h-2 w-2 bg-red-600" />
                      {isTelugu ? 'తిరస్కరించబడింది (Rejected)' : 'Rejected'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      {isTelugu ? 'రిక్వెస్ట్ అవసరం' : 'Request Required'}
                    </span>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Privacy Shield Notice - NEVER shows seller phone number */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  {isTelugu ? 'Animal Bazaar — గోప్యతా రక్షణ' : 'Animal Bazaar • Protected Contact'}
                </div>
                <p className="text-xs text-emerald-900/80 leading-relaxed">
                  {isTelugu
                    ? 'ఇద్దరి ఫోన్ నంబర్లు ఎవ్వరికీ కనిపించవు. ముందుగా కాల్ రిక్వెస్ట్ పంపి, రైతు ఆమోదించిన తర్వాతే "Animal Bazaar" పేరుతో కాల్ కనెక్ట్ అవుతుంది.'
                    : 'Phone numbers are completely hidden for both parties. Send a request first; once accepted, your call connects privately as "Animal Bazaar".'}
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {animal.status === 'closed' ? (
                  <Badge variant="destructive" className="w-full text-center justify-center py-2 text-base">
                    {isTelugu ? 'ఈ పశువు అమ్మబడింది' : 'Animal Sold Out'}
                  </Badge>
                ) : !user ? (
                  <>
                    <Button asChild className="w-full h-11 text-sm font-bold shadow-sm">
                      <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        {isTelugu ? 'కాల్ రిక్వెస్ట్ కోసం లాగిన్ అవ్వండి' : 'Login to Send Call Request'}
                      </Link>
                    </Button>
                    <Button
                      disabled
                      variant="outline"
                      className="w-full h-11 text-base font-semibold opacity-60 cursor-not-allowed"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      {isTelugu ? 'రైతుకు కాల్ చేయండి (Call Seller Now)' : 'Call Seller Now'}
                    </Button>
                  </>
                ) : isOwnListing ? (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                    <p className="font-semibold">
                      {isTelugu
                        ? 'ఇది మీరు పోస్ట్ చేసిన పశువు.'
                        : 'This is your own listing.'}
                    </p>
                    <p>
                      {isTelugu
                        ? 'కొనుగోలుదారుల కాల్ రిక్వెస్ట్‌లను నోటిఫికేషన్లలో ఆమోదించవచ్చు.'
                        : 'You can accept or decline buyer call requests from Notifications.'}
                    </p>
                    <Button asChild size="sm" variant="outline" className="w-full border-amber-400 text-amber-900 hover:bg-amber-100">
                      <Link href="/notifications">
                        <BellRing className="mr-1.5 h-3.5 w-3.5" />
                        {isTelugu ? 'రిక్వెస్ట్‌లు చూడండి' : 'View Call Requests'}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Step 1: Pre-Call Request Status & Trigger */}
                    {isCallAccepted ? (
                      <div className="p-3 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-700 flex-shrink-0" />
                        <span>
                          {isTelugu
                            ? 'రైతు మీ కాల్ రిక్వెస్ట్ ఆమోదించారు ✓ ఇప్పుడు కాల్ చేయవచ్చు.'
                            : 'Call Request Accepted ✓ You can call now via Animal Bazaar.'}
                        </span>
                      </div>
                    ) : isCallPending ? (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-start gap-2">
                        <Clock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
                        <span>
                          {isTelugu
                            ? 'రిక్వెస్ట్ పంపబడింది! రైతు అంగీకరించిన వెంటనే Call Seller Now బటన్ ఆక్టివేట్ అవుతుంది.'
                            : 'Request sent! Waiting for seller acceptance to activate Call Seller Now.'}
                        </span>
                      </div>
                    ) : (
                      <>
                        {isCallRejected && (
                          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <span>
                              {isTelugu
                                ? 'మునుపటి రిక్వెస్ట్ తిరస్కరించబడింది. మళ్లీ పంపవచ్చు.'
                                : 'Previous request was declined. You may send a new request.'}
                            </span>
                          </div>
                        )}
                        <Button
                          type="button"
                          onClick={handleSendCallRequest}
                          disabled={isSendingRequest}
                          variant="outline"
                          className="w-full h-11 text-sm font-bold border-primary text-primary hover:bg-primary/10"
                        >
                          <BellRing className="mr-2 h-4 w-4" />
                          {isTelugu ? 'కాల్ రిక్వెస్ట్ పంపండి (Send Request)' : 'Send Call Request First'}
                        </Button>
                      </>
                    )}

                    {/* Step 2: Call Seller Now (strictly disabled until Seller accepts) */}
                    <div className="space-y-1">
                      <Button
                        type="button"
                        onClick={handleMaskedCallSeller}
                        disabled={!isCallAccepted}
                        className={`w-full h-11 text-base font-semibold shadow-sm ${
                          isCallAccepted
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-muted text-muted-foreground border border-border opacity-70 cursor-not-allowed'
                        }`}
                      >
                        {isCallAccepted ? (
                          <Phone className="mr-2 h-4 w-4" />
                        ) : (
                          <Lock className="mr-2 h-4 w-4" />
                        )}
                        {isTelugu ? 'రైతుకు కాల్ చేయండి (Call Seller Now)' : 'Call Seller Now'}
                      </Button>
                      {!isCallAccepted && (
                        <p className="text-[11px] text-center text-muted-foreground">
                          {isTelugu
                            ? '🔒 రైతు రిక్వెస్ట్ ఆమోదించిన తర్వాతే ఈ బటన్ పనిచేస్తుంది'
                            : '🔒 Activates only after seller accepts your call request'}
                        </p>
                      )}
                    </div>

                    {/* Privacy-Masked Price Offer */}
                    <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="secondary" className="w-full h-10 font-semibold">
                          <Send className="mr-2 h-4 w-4" />
                          {isTelugu ? 'మీ ధర ఆఫర్ పంపండి' : 'Make a Price Offer'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{isTelugu ? 'రైతుకు ఆఫర్ పంపండి' : 'Make an Offer'}</DialogTitle>
                          <DialogDescription>
                            {isTelugu
                              ? `'${animal.title}' కోసం మీ ఆఫర్ ధరను Animal Bazaar ద్వారా గోప్యంగా పంపండి (ఫోన్ నంబర్ కనిపించదు).`
                              : `Submit your proposed price for '${animal.title}' privately via Animal Bazaar (your phone number stays hidden).`}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSendOffer} className="space-y-4 pt-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="offerPrice">{isTelugu ? 'మీ ఆఫర్ ధర (₹)' : 'Offered Price (₹)'}</Label>
                            <Input
                              id="offerPrice"
                              type="number"
                              value={offerPrice}
                              onChange={(e) => setOfferPrice(e.target.value)}
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              {isTelugu ? `అమ్మకందారు అసలు ధర: ₹${animal.price.toLocaleString('en-IN')}` : `Original asking price: ₹${animal.price.toLocaleString('en-IN')}`}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="offerNote">{isTelugu ? 'సందేశం (Message)' : 'Note / Message'}</Label>
                            <Textarea
                              id="offerNote"
                              rows={3}
                              placeholder={isTelugu ? 'ఉదా: నేను రేపు స్వయంగా వచ్చి చూస్తాను...' : 'e.g. Can visit tomorrow for inspection...'}
                              value={offerNote}
                              onChange={(e) => setOfferNote(e.target.value)}
                            />
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOfferDialogOpen(false)}>
                              {isTelugu ? 'రద్దు' : 'Cancel'}
                            </Button>
                            <Button type="submit" disabled={isSubmittingOffer}>
                              {isSubmittingOffer ? (isTelugu ? 'పంపుతోంది...' : 'Sending...') : (isTelugu ? 'ఆఫర్ పంపండి' : 'Send Offer')}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>

              <div className="text-xs text-muted-foreground text-center pt-2">
                {isTelugu
                  ? '🔒 Animal Bazaar ద్వారా ఇద్దరి ఫోన్ నంబర్లు 100% గోప్యంగా ఉంటాయి.'
                  : '🔒 100% Privacy via Animal Bazaar. Neither phone number is ever exposed.'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}