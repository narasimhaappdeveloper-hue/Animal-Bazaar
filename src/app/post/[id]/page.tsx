'use client';

import { animals } from '@/lib/animals';
import { notFound, useParams } from 'next/navigation';
import AnimalDetailsClient from '@/components/animal-details-client';
import { useMemo } from 'react';

type Props = {
  // params are no longer passed as props in this pattern
};

export default function AnimalDetailsPage({}: Props) {
  const params = useParams();
  const id = params.id as string;

  const animal = useMemo(() => {
    // In a real app, you'd likely fetch this data based on the ID.
    // For this prototype, we find it in the global array.
    return animals.find((a) => a.id === id);
  }, [id]);

  if (!animal) {
    // This will show a "Not Found" page if the animal doesn't exist.
    // In a real app, you might want a more specific loading/error state
    // while the client-side data is being prepared.
    return notFound();
  }

  return <AnimalDetailsClient animal={animal} />;
}
