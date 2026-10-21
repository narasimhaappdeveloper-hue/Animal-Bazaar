

'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { breeds, animalCategories, type AnimalCategory, allDistricts, states, State, locations } from '@/lib/definitions';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';
import { addAnimal } from '@/lib/animals';
import { validateAnimalImage } from '@/ai/flows/validate-animal-image';
import { Loader2, AlertTriangle, UploadCloud } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function NewPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<AnimalCategory | ''>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedBreed, setSelectedBreed] = useState('');
  const [price, setPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  
  const [selectedYears, setSelectedYears] = useState('0');
  const [selectedMonths, setSelectedMonths] = useState('0');


  const [selectedState, setSelectedState] = useState<State | ''>('');
  
  const districts = useMemo(() => {
    if (!selectedState || selectedState === "all") return allDistricts;
    return locations[selectedState as State] || [];
  }, [selectedState]);

  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  
  const [isVerifyingImage, setIsVerifyingImage] = useState(false);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);


  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageValidationError(null);
    setImagePreview(null);
    setIsVerifyingImage(true);

    const reader = new FileReader();
    reader.onerror = (error) => {
      console.error('FileReader error while reading animal image:', error);
      setImageValidationError('Could not read the selected image file. Please try again.');
      setImagePreview(null);
      setIsVerifyingImage(false);
    };
    reader.onloadend = async () => {
      const dataUri = reader.result as string;
      setImagePreview(dataUri); // Show preview immediately

      try {
        const validationResult = await validateAnimalImage({ photoDataUri: dataUri });
        if (!validationResult.containsAnimal) {
          setImageValidationError(validationResult.reason || 'No animal detected in the image. Please upload a different picture.');
          setImagePreview(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset file input
          }
        }
      } catch (error) {
        console.error('Image validation error:', error);
        setImageValidationError('Could not verify the image. Please try again.');
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } finally {
        setIsVerifyingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > 6) {
      setPriceError('Price cannot exceed 6 digits.');
    } else {
      setPriceError('');
    }
    setPrice(value);
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);
    
    // Regex for phone numbers, emails, and social media handles
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const socialRegex = /(?:@|facebook|instagram|twitter|fb\.com|insta\.com)[\w.]+/gi;
    const addressKeywords = /\b(address|street|road|house no|H\.No)\b/gi;


    if (phoneRegex.test(value) || emailRegex.test(value) || socialRegex.test(value) || addressKeywords.test(value)) {
      setDescriptionError('Description should not contain contact information (phone, email, address, or social media).');
    } else {
      setDescriptionError('');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (priceError) {
      toast({
        variant: 'destructive',
        title: 'Invalid Price',
        description: priceError,
      });
      return;
    }
    
    if (descriptionError) {
      toast({
        variant: 'destructive',
        title: 'Invalid Description',
        description: descriptionError,
      });
      return;
    }

    if (imageValidationError || isVerifyingImage || !imagePreview) {
      toast({
        variant: 'destructive',
        title: 'Invalid Image',
        description: 'Please upload a valid image of an animal.',
      });
      return;
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to post.',
      });
      return;
    }
    const formData = new FormData(e.currentTarget);
    const category = formData.get('category') as AnimalCategory;
    const location = formData.get('location') as string;
    const breedValue = formData.get('breed') as string;
    const finalBreed = breedValue === 'Other' ? formData.get('otherBreed') as string : breedValue;
    const title = `${finalBreed} ${category} in ${location}`;
    
    const years = parseInt(selectedYears, 10);
    const months = parseInt(selectedMonths, 10);
    let ageString = '';
    if (years > 0) {
      ageString += `${years} year${years > 1 ? 's' : ''}`;
    }
    if (months > 0) {
      if (ageString.length > 0) ageString += ' ';
      ageString += `${months} month${months > 1 ? 's' : ''}`;
    }
    if (!ageString) ageString = '0 months';


    try {
      addAnimal({
        id: Date.now().toString(),
        uid: user.uid,
        userName: user.name,
        userPhone: user.phone,
        title: title,
        category: category,
        breed: finalBreed,
        age: ageString,
        price: Number(formData.get('price')),
        location: location,
        desc: formData.get('description') as string,
        imageUrl: imagePreview || 'https://picsum.photos/seed/placeholder/400/300',
        imageHint: 'new animal',
        status: 'active',
        createdAt: Date.now(),
        featured: true,
      });
      
      toast({
        title: 'Success!',
        description: 'Your animal has been posted for sale.',
      });
      router.push('/profile');
    } catch (error) {
      console.error('Error posting animal:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to post animal. Please try again.',
      });
    }
  };

  const isSubmitDisabled = isVerifyingImage || !!imageValidationError;

  if (!user) {
    return (
      <div className="text-center text-lg text-muted-foreground">
        Redirecting to login...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Post an Animal for Sale</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postCategory">Animal Type</Label>
                <Select name="category" onValueChange={(value) => {
                    setSelectedCategory(value as AnimalCategory);
                    setSelectedBreed('');
                }} required>
                  <SelectTrigger id="postCategory">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {animalCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postBreed">Breed</Label>
                <Select name="breed" value={selectedBreed} onValueChange={setSelectedBreed} disabled={!selectedCategory} required>
                  <SelectTrigger id="postBreed">
                    <SelectValue placeholder="Select Breed" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategory && breeds[selectedCategory].map(breed => (
                      <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedBreed === 'Other' && (
                <div className="space-y-2">
                    <Label htmlFor="otherBreed">Please specify breed</Label>
                    <Input id="otherBreed" name="otherBreed" placeholder="Enter breed name" required />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="postState">State</Label>
                <Select name="state" onValueChange={(value) => setSelectedState(value as State)} required>
                  <SelectTrigger id="postState">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="postLocation">District</Label>
                <Select name="location" required disabled={!selectedState}>
                  <SelectTrigger id="postLocation">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district, index) => (
                      <SelectItem key={`${district}-${index}`} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postPrice">Price (₹)</Label>
                  <Input 
                    name="price" 
                    id="postPrice" 
                    type="number" 
                    placeholder="e.g., 75000" 
                    value={price}
                    onChange={handlePriceChange}
                    required 
                  />
                  {priceError && <p className="text-sm font-medium text-destructive">{priceError}</p>}
                </div>
                 <div className="space-y-2">
                    <Label>Age</Label>
                    <div className="grid grid-cols-2 gap-2">
                       <Select name="ageYears" value={selectedYears} onValueChange={setSelectedYears}>
                            <SelectTrigger>
                                <SelectValue placeholder="Years" />
                            </SelectTrigger>
                            <SelectContent>
                                {[...Array(31).keys()].map(year => (
                                    <SelectItem key={year} value={String(year)}>{year} year{year !== 1 && 's'}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <Select name="ageMonths" value={selectedMonths} onValueChange={setSelectedMonths}>
                            <SelectTrigger>
                                <SelectValue placeholder="Months" />
                            </SelectTrigger>
                            <SelectContent>
                                {[...Array(12).keys()].map(month => (
                                    <SelectItem key={month} value={String(month)}>{month} month{month !== 1 && 's'}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              </div>

            <div className="space-y-2">
              <Label htmlFor="postDesc">Description</Label>
              <Textarea 
                name="description" 
                id="postDesc" 
                placeholder="Details: Vaccinated, milk yield, weight..."
                value={description}
                onChange={handleDescriptionChange}
              />
              {descriptionError && <p className="text-sm font-medium text-destructive">{descriptionError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postImage">Image</Label>
              <div className="relative h-48 w-full rounded-md border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden">
                {imagePreview && (
                  <div className="relative w-full h-full">
                    <Image src={imagePreview} alt="Preview" fill objectFit="contain" className="rounded-md" />
                  </div>
                )}
                {isVerifyingImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Verifying image...</p>
                  </div>
                )}
                {!imagePreview && !isVerifyingImage && (
                  <div className="text-center text-muted-foreground">
                    <UploadCloud className="mx-auto h-12 w-12" />
                    <p className="mt-2 text-sm">Click to upload an image</p>
                    <p className="text-xs">The image must contain an animal.</p>
                  </div>
                )}
              </div>
              <Input 
                ref={fileInputRef}
                name="image" 
                id="postImage" 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                required 
                className="mt-2"
              />
               {imageValidationError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Image Rejected</AlertTitle>
                    <AlertDescription>{imageValidationError}</AlertDescription>
                  </Alert>
              )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-10 max-w-2xl mx-auto">
                <div className="flex gap-4">
                    <Button type="submit" className="flex-1" disabled={isSubmitDisabled} style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                        {isVerifyingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Post Animal
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
