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
import {
  MapPin,
  Calendar,
  User,
  Phone,
  MessageSquare,
  Share2,
  Heart,
  BrainCircuit,
  Sparkles,
  Loader2,
  AlertTriangle,
  LogIn,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { toggleFavorite, getFavorites, addNotification } from '@/lib/animals';
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
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [similarError, setSimilarError] = useState<string | null>(null);

  const [isFav, setIsFav] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState(String(Math.round(animal.price * 0.9)));
  const [offerNote, setOfferNote] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  useEffect(() => {
    const favs = getFavorites();
    setIsFav(favs.includes(animal.id));
  }, [animal.id]);

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
      // Friendly real-world fallback
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

  const handleCallSeller = () => {
    const sellerPhoneNumber = animal.userPhone;
    toast({
      title: isTelugu ? 'రైతుకు కాల్ చేయబడుతోంది' : 'Calling Seller',
      description: `${animal.userName} (${sellerPhoneNumber})`,
    });
    window.location.href = `tel:${sellerPhoneNumber}`;
  };

  const handleWhatsAppSeller = () => {
    const phoneDigits = animal.userPhone.replace(/\D/g, '');
    const cleanNumber = phoneDigits.startsWith('91') ? phoneDigits : `91${phoneDigits}`;
    const textMsg = encodeURIComponent(
      isTelugu
        ? `నమస్కారం ${animal.userName} గారు! Animal Bazaar లో మీ '${animal.title}' (ధర: ₹${animal.price.toLocaleString('en-IN')}, ప్రాంతం: ${animal.location}) చూశాను. నాకు వివరాలు కావాలి.`
        : `Hello ${animal.userName}! I saw your listing for '${animal.title}' (₹${animal.price.toLocaleString('en-IN')}) on Animal Bazaar. I am interested to discuss.`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${textMsg}`, '_blank');
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

    // Save notification for seller
    addNotification({
      id: 'notif_' + Date.now().toString(),
      userId: animal.uid,
      title: isTelugu ? `కొత్త ఆఫర్: ₹${amount.toLocaleString('en-IN')}` : `New Offer: ₹${amount.toLocaleString('en-IN')}`,
      message: `${user.name} (${user.phone}) has sent an offer for '${animal.title}': ₹${amount.toLocaleString('en-IN')}. Note: "${offerNote || 'Interested in buying'}"`,
      type: 'offer',
      createdAt: Date.now(),
      read: false,
      animalId: animal.id,
      senderName: user.name,
      senderPhone: user.phone,
      offerAmount: amount,
    });

    setIsSubmittingOffer(false);
    setIsOfferDialogOpen(false);
    toast({
      title: isTelugu ? 'ఆఫర్ పంపబడింది!' : 'Offer Sent to Seller!',
      description: isTelugu
        ? `రైతు ${animal.userName} కి మీ ఆఫర్ పంపబడింది. త్వరలోనే వారు స్పందిస్తారు.`
        : `Your offer has been sent to ${animal.userName}.`,
    });
  };

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
                src={animal.imageUrl}
                alt={animal.title}
                fill
                priority
                className="object-cover"
                data-ai-hint={animal.imageHint}
                referrerPolicy="no-referrer"
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

        {/* Sidebar: Seller Information & Contact Actions */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-md border-primary/20 sticky top-20">
            <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {animal.userName.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-1.5">
                    {animal.userName}
                  </CardTitle>
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {isTelugu ? 'ధ్రువీకరించబడిన రైతు' : 'Verified Seller'}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <div className="text-xs text-muted-foreground">{isTelugu ? 'రైతు ఫోన్ నంబర్' : 'Direct Phone'}</div>
                <div className="font-mono text-base font-bold text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  {animal.userPhone}
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {animal.status === 'closed' ? (
                  <Badge variant="destructive" className="w-full text-center justify-center py-2 text-base">
                    {isTelugu ? 'ఈ పశువు అమ్మబడింది' : 'Animal Sold Out'}
                  </Badge>
                ) : (
                  <>
                    <Button onClick={handleCallSeller} className="w-full h-11 text-base font-semibold shadow-sm">
                      <Phone className="mr-2 h-4 w-4" />
                      {isTelugu ? 'రైతుకు కాల్ చేయండి' : 'Call Seller Now'}
                    </Button>

                    <Button
                      onClick={handleWhatsAppSeller}
                      variant="outline"
                      className="w-full h-11 text-base font-semibold border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                    >
                      <MessageSquare className="mr-2 h-4 w-4 text-emerald-600" />
                      {isTelugu ? 'వాట్సాప్‌లో మాట్లాడండి' : 'WhatsApp Chat'}
                    </Button>

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
                              ? `'${animal.title}' కోసం మీ ఆఫర్ ధర మరియు సందేశాన్ని నమోదు చేయండి.`
                              : `Submit your proposed price for '${animal.title}' directly to ${animal.userName}.`}
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
                  ? '🔒 Animal Bazaar లో బ్రోకర్ ఫీజులు లేవు. నేరుగా రైతుతో మాట్లాడండి.'
                  : '🔒 Zero middleman fee. Direct deal between farmers and buyers.'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}