'use client';

import { getStoredAnimals } from '@/lib/animals';
import { notFound, useParams } from 'next/navigation';
import AnimalDetailsClient from '@/components/animal-details-client';
import { useMemo, useState, useEffect } from 'react';
import type { Animal } from '@/lib/definitions';

export default function AnimalDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [animal, setAnimal] = useState<Animal | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    const all = getStoredAnimals();
    const found = all.find((a) => a.id === id);
    setAnimal(found || null);
  }, [id]);

  if (animal === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p>Loading animal details...</p>
      </div>
    );
  }

  if (animal === null) {
    return notFound();
  }

  return <AnimalDetailsClient animal={animal} />;
}
