'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import type { Animal } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Calendar, MapPin, Heart, Phone } from 'lucide-react';
import { AnimalIcon } from './animal-icon';
import { getFavorites, toggleFavorite } from '@/lib/animals';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

type AnimalCardProps = {
  animal: Animal;
};

export default function AnimalCard({ animal }: AnimalCardProps) {
  const { language } = useAuth();
  const { toast } = useToast();
  const isTelugu = language === 'te';
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const favs = getFavorites();
    setIsFav(favs.includes(animal.id));
  }, [animal.id]);

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
              src={animal.imageUrl}
              alt={animal.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={animal.imageHint}
              referrerPolicy="no-referrer"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
        </CardContent>
      </div>

      <div className="p-4 pt-2 border-t border-muted/60 mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{formatDistanceToNow(new Date(animal.createdAt), { addSuffix: true })}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button asChild size="sm" variant="default" className="h-8 text-xs font-semibold px-3">
            <Link href={`/post/${animal.id}`}>
              {isTelugu ? 'వివరాలు' : 'View Details'}
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
