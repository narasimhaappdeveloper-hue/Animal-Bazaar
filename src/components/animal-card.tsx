import Link from 'next/link';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';

import type { Animal } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Calendar, Tag, MapPin } from 'lucide-react';
import { AnimalIcon } from './animal-icon';

type AnimalCardProps = {
  animal: Animal;
};

export default function AnimalCard({ animal }: AnimalCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/post/${animal.id}`} className="block">
        <div className="relative">
          <Image
            src={animal.imageUrl}
            alt={animal.title}
            width={400}
            height={300}
            className="aspect-[4/3] w-full object-cover"
            data-ai-hint={animal.imageHint}
          />
          {animal.status === 'closed' && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              SOLD
            </Badge>
          )}
           <div className="absolute bottom-2 right-2">
              <Badge variant="secondary">{formatPrice(animal.price)}</Badge>
           </div>
        </div>
      </Link>
      <CardContent className="p-4">
        <h3 className="text-lg font-bold leading-tight">
           <Link href={`/post/${animal.id}`} className="hover:text-primary transition-colors">
            {animal.title}
          </Link>
        </h3>
        
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
                <AnimalIcon category={animal.category} className="h-4 w-4" />
                <span>{animal.breed}</span>
            </div>
            <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{animal.location}</span>
            </div>
        </div>
       
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
             <Calendar className="h-4 w-4" />
             <time dateTime={new Date(animal.createdAt).toISOString()}>
              {formatDistanceToNow(new Date(animal.createdAt), { addSuffix: true })}
             </time>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/post/${animal.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
