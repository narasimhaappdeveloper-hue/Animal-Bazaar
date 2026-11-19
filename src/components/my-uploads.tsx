'use client';

import type { Animal } from '@/lib/definitions';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';
import { updateAnimalStatus, deleteAnimal } from '@/lib/animals';
import Link from 'next/link';
import { CheckCircle2, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

type MyUploadsProps = {
  myUploads: Animal[];
};

export default function MyUploads({ myUploads: initialUploads }: MyUploadsProps) {
  const { toast } = useToast();
  const { language } = useAuth();
  const isTelugu = language === 'te';
  const [myUploads, setMyUploads] = useState<Animal[]>(initialUploads);

  useEffect(() => {
    setMyUploads(initialUploads);
  }, [initialUploads]);

  const handleCloseSale = (id: string, title: string) => {
    try {
      updateAnimalStatus(id, 'closed');
      setMyUploads((currentUploads) =>
        currentUploads.map((animal) => (animal.id === id ? { ...animal, status: 'closed' } : animal))
      );
      toast({
        title: isTelugu ? 'అమ్మబడిందిగా గుర్తించబడింది' : 'Marked as Sold',
        description: isTelugu ? `'${title}' విజయవంతంగా అమ్మబడింది.` : `'${title}' has been marked as sold.`,
      });
    } catch (err) {
      console.error('Failed to mark animal as sold:', err);
    }
  };

  const handleDelete = (id: string, title: string) => {
    try {
      deleteAnimal(id);
      setMyUploads((currentUploads) => currentUploads.filter((animal) => animal.id !== id));
      toast({
        variant: 'destructive',
        title: isTelugu ? 'ప్రకటన తొలగించబడింది' : 'Listing Deleted',
        description: isTelugu ? `'${title}' విజయవంతంగా తొలగించబడింది.` : `'${title}' has been removed from marketplace.`,
      });
    } catch (err) {
      console.error('Failed to delete listing:', err);
    }
  };

  return (
    <Card className="border-muted">
      <CardHeader>
        <CardTitle>{isTelugu ? 'మీరు పోస్ట్ చేసిన పశువులు' : 'Your Uploaded Animals'}</CardTitle>
      </CardHeader>
      <CardContent>
        {myUploads.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-3">
            <p>{isTelugu ? 'మీరు ఇంకా ఎటువంటి పశువులను పోస్ట్ చేయలేదు.' : "You haven't posted any animals for sale yet."}</p>
            <Button asChild size="sm">
              <Link href="/post/new">{isTelugu ? 'పశువును అమ్మకానికి పెట్టండి' : 'Post Animal for Sale'}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {myUploads.map((animal) => (
              <Card key={animal.id} className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4 justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative w-24 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={animal.imageUrl}
                      alt={animal.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                      data-ai-hint={animal.imageHint}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <Link href={`/post/${animal.id}`} className="font-semibold hover:underline flex items-center gap-1.5">
                      {animal.title}
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </Link>
                    <p className="text-sm font-bold text-primary">{formatPrice(animal.price)}</p>
                    <p className="text-xs text-muted-foreground">{animal.location} • {animal.breed}</p>
                    {animal.status === 'closed' ? (
                      <Badge variant="destructive" className="mt-1">
                        {isTelugu ? 'అమ్మబడింది (SOLD)' : 'SOLD'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="mt-1 bg-emerald-100 text-emerald-800">
                        {isTelugu ? 'అమ్మకానికి సిద్ధంగా ఉంది' : 'Active'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-0 border-muted">
                  {animal.status !== 'closed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      onClick={() => handleCloseSale(animal.id, animal.title)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                      {isTelugu ? 'అమ్మబడిందిగా గుర్తించు' : 'Mark as Sold'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(animal.id, animal.title)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {isTelugu ? 'తొలగించు' : 'Delete'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
