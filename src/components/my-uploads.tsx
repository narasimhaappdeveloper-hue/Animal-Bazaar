'use client';

import type { Animal } from '@/lib/definitions';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';
import { animals } from '@/lib/animals';

type MyUploadsProps = {
  myUploads: Animal[];
};

export default function MyUploads({ myUploads: initialUploads }: MyUploadsProps) {
  const { toast } = useToast();
  const [myUploads, setMyUploads] = useState<Animal[]>(initialUploads);

  useEffect(() => {
    setMyUploads(initialUploads);
  }, [initialUploads]);

  const handleCloseSale = (id: string) => {
    try {
      // Find the animal in the global array and update its status
      const animalIndex = animals.findIndex(a => a.id === id);
      if (animalIndex !== -1) {
        animals[animalIndex].status = 'closed';
      }

      // Update the local state to trigger a re-render
      setMyUploads(currentUploads =>
        currentUploads.map(animal =>
          animal.id === id ? { ...animal, status: 'closed' } : animal
        )
      );

      toast({
        title: 'Sale Closed',
        description: `Post ${id} has been marked as sold.`,
      });
    } catch (error) {
      console.error('Error closing animal sale:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update post status.',
      });
    }
  };

  const handleDelete = (id: string) => {
    try {
      // Remove from the global array
      const animalIndex = animals.findIndex(a => a.id === id);
      if (animalIndex > -1) {
        animals.splice(animalIndex, 1);
      }
  
      // Remove from local state to trigger re-render
      setMyUploads(currentUploads => currentUploads.filter(animal => animal.id !== id));

      toast({
        variant: 'destructive',
        title: 'Post Deleted',
        description: `Post ${id} has been deleted.`,
      });
    } catch (error) {
      console.error('Error deleting animal post:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete post.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Uploads</CardTitle>
      </CardHeader>
      <CardContent>
        {myUploads.length === 0 ? (
          <p className="text-muted-foreground">You haven&apos;t posted any animals yet.</p>
        ) : (
          <div className="space-y-4">
            {myUploads.map(animal => (
              <Card key={animal.id} className="flex items-center p-4">
                <Image
                  src={animal.imageUrl}
                  alt={animal.title}
                  width={110}
                  height={80}
                  className="rounded-md object-cover aspect-[11/8]"
                  data-ai-hint={animal.imageHint}
                />
                <div className="ml-4 flex-1">
                  <h4 className="font-semibold">{animal.title}</h4>
                  <p className="text-sm text-muted-foreground">{formatPrice(animal.price)}</p>
                  {animal.status === 'closed' && (
                    <Badge variant="destructive" className="mt-1">SOLD</Badge>
                  )}
                </div>
                <div className="ml-4 flex flex-col sm:flex-row gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleCloseSale(animal.id)} disabled={animal.status === 'closed'}>Mark as Sold</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(animal.id)}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
