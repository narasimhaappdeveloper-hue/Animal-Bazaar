'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import type { Animal, CallRequest } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Calendar, MapPin, Heart, PhoneCall, XCircle } from 'lucide-react';
import { AnimalIcon } from './animal-icon';
import {
  getFavorites,
  toggleFavorite,
  getCallRequestForBuyerAndAnimal,
  getCallRequests,
  SYNC_EVENT_NAME,
} from '@/lib/animals';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

type AnimalCardProps = {
  animal: Animal;
};

export default function AnimalCard({ animal }: AnimalCardProps) {
  const { user, language } = useAuth();
  const { toast } = useToast();
  const isTelugu = language === 'te';
  const fallbackImage = 'https://images.unsplash.com/photo-1695902878213-f555035ac175?auto=format&fit=crop&w=800&q=80';
  const [imgSrc, setImgSrc] = useState(animal.imageUrl);
  const [isFav, setIsFav] = useState(false);
  const [callRequest, setCallRequest] = useState<CallRequest | null>(null);
  const [sellerPendingCount, setSellerPendingCount] = useState(0);

  useEffect(() => {
    setImgSrc(animal.imageUrl);
  }, [animal.imageUrl]);

  const syncCardState = useCallback(() => {
    const favs = getFavorites();
    setIsFav(favs.includes(animal.id));

    if (!user) {
      setCallRequest(null);
      setSellerPendingCount(0);
      return;
    }

    if (user.uid === animal.uid) {
      setCallRequest(null);
      const pendingForAnimal = getCallRequests({ sellerUid: user.uid }).filter(
        (r) => r.animalId === animal.id && r.status === 'pending'
      );
      setSellerPendingCount(pendingForAnimal.length);
    } else {
      setSellerPendingCount(0);
      setCallRequest(getCallRequestForBuyerAndAnimal(user.uid, animal.id));
    }
  }, [user, animal.id, animal.uid]);

  useEffect(() => {
    syncCardState();
    window.addEventListener(SYNC_EVENT_NAME, syncCardState);
    window.addEventListener('storage', syncCardState);
    const poll = setInterval(syncCardState, 2000);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, syncCardState);
      window.removeEventListener('storage', syncCardState);
      clearInterval(poll);
    };
  }, [syncCardState]);

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowFav = toggleFavorite(animal.id);
    setIsFav(nowFav);
    toast({
      title: nowFav
        ? (isTelugu ? 'ఇష్టమైన వాటిలో చేర్చబడింది' : 'Added to Wishlist')
        : (isTelugu ? 'ఇష్టమైన వాటి నుండి తీసివేయబడింది' : 'Removed from Wishlist'),
      description: animal.title,
    });
  };

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-xl border-border/80 flex flex-col justify-between bg-card">
      <div>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <Link href={`/post/${animal.id}`} className="block w-full h-full">
            <Image
              src={imgSrc}
              alt={animal.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={animal.imageHint}
              referrerPolicy="no-referrer"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              onError={() => {
                if (imgSrc !== fallbackImage) {
                  setImgSrc(fallbackImage);
                }
              }}
            />
          </Link>

          {/* Favorite button */}
          <button
            type="button"
            onClick={handleToggleFav}
            className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white transition-colors z-10"
            aria-label="Save to favorites"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFav ? 'text-red-500 fill-red-500' : 'text-white'
              }`}
            />
          </button>

          {animal.status === 'closed' ? (
            <Badge variant="destructive" className="absolute top-2.5 left-2.5 font-bold shadow-sm">
              {isTelugu ? 'అమ్మబడింది (SOLD)' : 'SOLD'}
            </Badge>
          ) : (
            <Badge className="absolute top-2.5 left-2.5 bg-emerald-600/90 text-white font-semibold backdrop-blur-sm border-none shadow-sm">
              {isTelugu ? 'అమ్మకానికి ఉంది' : 'Available'}
            </Badge>
          )}

          <div className="absolute bottom-2.5 left-2.5">
            <div className="bg-black/75 backdrop-blur-md px-3 py-1 rounded-md text-white font-bold text-base shadow-sm">
              {formatPrice(animal.price)}
            </div>
          </div>

          {/* Live Call Request Status Indicator Chip on Card Image */}
          {callRequest && animal.status !== 'closed' && (
            <div className="absolute bottom-2.5 right-2.5 z-10">
              {callRequest.status === 'accepted' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/90 border border-emerald-400/70 px-2.5 py-1 text-[11px] font-bold text-emerald-100 shadow-md backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  {isTelugu ? 'కాల్ సిద్ధం' : 'Call Active'}
                </span>
              ) : callRequest.status === 'pending' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/90 border border-amber-400/70 px-2.5 py-1 text-[11px] font-bold text-amber-100 shadow-md backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                  </span>
                  {isTelugu ? 'రిక్వెస్ట్ పెండింగ్' : 'Call Pending'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-950/90 border border-red-400/70 px-2.5 py-1 text-[11px] font-bold text-red-100 shadow-md backdrop-blur-sm">
                  <XCircle className="h-3 w-3 text-red-400" />
                  {isTelugu ? 'తిరస్కరించబడింది' : 'Call Declined'}
                </span>
              )}
            </div>
          )}

          {sellerPendingCount > 0 && (
            <div className="absolute bottom-2.5 right-2.5 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/90 border border-amber-400/70 px-2.5 py-1 text-[11px] font-bold text-amber-100 shadow-md backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                </span>
                {isTelugu ? `${sellerPendingCount} కాల్ రిక్వెస్ట్` : `${sellerPendingCount} Call Req`}
              </span>
            </div>
          )}
        </div>

        <CardContent className="p-4 pb-2">
          <h3 className="text-base font-bold leading-snug line-clamp-2 min-h-[2.5rem]">
            <Link href={`/post/${animal.id}`} className="hover:text-primary transition-colors">
              {animal.title}
            </Link>
          </h3>

          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1 font-medium text-foreground/80">
              <AnimalIcon category={animal.category} className="h-3.5 w-3.5 text-primary" />
              <span>{animal.breed}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{animal.location}</span>
            </div>
            {animal.age && (
              <div className="text-muted-foreground">
                • {animal.age}
              </div>
            )}
          </div>

          {/* Descriptive Call Status Chip */}
          {callRequest && animal.status !== 'closed' && (
            <div className="mt-2.5">
              {callRequest.status === 'accepted' ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  {isTelugu ? 'కాల్ ఆమోదించబడింది — Call Seller Now సిద్ధం' : 'Call Accepted — Ready to Call'}
                </div>
              ) : callRequest.status === 'pending' ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  {isTelugu ? 'కాల్ రిక్వెస్ట్ పెండింగ్‌లో ఉంది' : 'Call Request Pending Approval'}
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                  <span className="inline-flex rounded-full h-2 w-2 bg-red-500" />
                  {isTelugu ? 'కాల్ రిక్వెస్ట్ తిరస్కరించబడింది' : 'Call Request Rejected'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>

      <div className="p-4 pt-2 border-t border-muted/60 mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{formatDistanceToNow(new Date(animal.createdAt), { addSuffix: true })}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {callRequest?.status === 'accepted' && animal.status !== 'closed' ? (
            <Button asChild size="sm" className="h-8 text-xs font-semibold px-3 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link href={`/post/${animal.id}`}>
                <PhoneCall className="w-3.5 h-3.5 mr-1" />
                {isTelugu ? 'కాల్ చేయండి' : 'Call Now'}
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="default" className="h-8 text-xs font-semibold px-3">
              <Link href={`/post/${animal.id}`}>
                {isTelugu ? 'వివరాలు' : 'View Details'}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
