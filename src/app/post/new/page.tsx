'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
import { db, app } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { validateAnimalImage } from '@/ai/flows/validate-animal-image';
import { Loader2, AlertTriangle, UploadCloud } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const storage = getStorage(app);

export default function NewPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<AnimalCategory | ''>('');
  const [selectedBreed, setSelectedBreed] = useState('');
  const [selectedYears, setSelectedYears] = useState('0');
  const [selectedMonths, setSelectedMonths] = useState('0');
  const [selectedState, setSelectedState] = useState<State | ''>('');

  const [price, setPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  // Image Upload & Validation States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isVerifyingImage, setIsVerifyingImage] = useState(false);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const districts = useMemo(() => {
    if (!selectedState || selectedState === 'all') return allDistricts;
    return locations[selectedState as State] || [];
  }, [selectedState]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setImageValidationError('File size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    setImageValidationError(null);
    setImagePreview(null);
    setSelectedFile(null);
    setIsVerifyingImage(true);

    const reader = new FileReader();
    reader.onerror = () => {
      setImageValidationError('Could not read the selected image file. Please try again.');
      setIsVerifyingImage(false);
    };

    reader.onloadend = async () => {
      const dataUri = reader.result as string;
      setImagePreview(dataUri);

      try {
        const validationResult = await validateAnimalImage({ photoDataUri: dataUri });
        if (!validationResult.containsAnimal) {
          setImageValidationError(validationResult.reason || 'No animal detected in the image. Please upload a clear animal photo.');
          setImagePreview(null);
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          setSelectedFile(file);
        }
      } catch (error) {
        console.error('Image validation error:', error);
        setImageValidationError('Could not verify the image. Please try again.');
        setImagePreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } finally {
        setIsVerifyingImage(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > 7) {
      setPriceError('Price cannot exceed 7 digits.');
    } else {
      setPriceError('');
    }
    setPrice(value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);

    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const socialRegex = /(?:@|facebook|instagram|twitter|fb\.com|insta\.com)[\w.]+/gi;
    const addressKeywords = /\b(address|street|road|house no|H\.No)\b/gi;

    if (phoneRegex.test(value) || emailRegex.test(value) || socialRegex.test(value) || addressKeywords.test(value)) {
      setDescriptionError('Description should not contain direct contact details (phone, email, address). Calls are routed safely through Animal Bazaar.');
    } else {
      setDescriptionError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (priceError || !price) {
      toast({
        variant: 'destructive',
        title: 'Invalid Price',
        description: priceError || 'Please enter a valid price.',
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

    if (!selectedFile || isVerifyingImage || Boolean(imageValidationError)) {
      toast({
        variant: 'destructive',
        title: 'Valid Animal Photo Required',
        description: 'Please upload and verify an animal image before posting.',
      });
      return;
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login Required',
        description: 'You must be logged in to post.',
      });
      router.push('/login');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const category = formData.get('category') as AnimalCategory;
    const location = formData.get('location') as string;
    const breedValue = formData.get('breed') as string;
    const finalBreed = breedValue === 'Other' ? (formData.get('otherBreed') as string) : breedValue;
    const title = `${finalBreed} ${category} in ${location}`;

    const years = parseInt(selectedYears, 10);
    const months = parseInt(selectedMonths, 10);
    let ageString = '';
    if (years > 0) ageString += `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) {
      if (ageString.length > 0) ageString += ' ';
      ageString += `${months} month${months > 1 ? 's' : ''}`;
    }
    if (!ageString) ageString = '0 months';

    setIsSubmitting(true);

    try {
      const fileExt = selectedFile.name.split('.').pop() || 'jpg';
      const storagePath = `animals/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (uploadError) => {
          console.error('Firebase Storage upload error:', uploadError);
          setIsSubmitting(false);
          toast({
            variant: 'destructive',
            title: 'Image Upload Failed',
            description: 'Could not upload the animal photo. Please check your network and try again.',
          });
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          await addDoc(collection(db, 'animals'), {
            title: title.trim(),
            category: category,
            breed: finalBreed.trim(),
            age: ageString,
            price: Number(formData.get('price')),
            state: selectedState,
            location: location,
            desc: (formData.get('description') as string).trim(),
            imageUrl: downloadUrl,
            imageHint: `${finalBreed} ${category}`,
            userId: user.uid,
            userName: user.name || 'Animal Bazaar Seller',
            userPhone: user.phone,
            status: 'active',
            featured: true,
            createdAt: serverTimestamp(),
          });

          setIsSubmitting(false);
          toast({
            title: 'Success!',
            description: 'Your animal has been posted live on Animal Bazaar.',
          });

          router.push('/');
        }
      );
    } catch (error) {
      console.error('Error saving animal post to Firestore:', error);
      setIsSubmitting(false);
      toast({
        variant: 'destructive',
        title: 'Failed to Post',
        description: 'An error occurred while publishing your post. Please try again.',
      });
    }
  };

  const isSubmitDisabled = isVerifyingImage || Boolean(imageValidationError) || !imagePreview || isSubmitting;

  if (!user) {
    return (
      <div className="text-center text-lg text-muted-foreground py-16">
        Redirecting to login...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-28 pt-4 px-4">
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Post an Animal for Sale</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postCategory">Animal Type</Label>
                <Select
                  name="category"
                  onValueChange={(value) => {
                    setSelectedCategory(value as AnimalCategory);
                    setSelectedBreed('');
                  }}
                  required
                >
                  <SelectTrigger id="postCategory">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {animalCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postBreed">Breed</Label>
                <Select
                  name="breed"
                  value={selectedBreed}
                  onValueChange={setSelectedBreed}
                  disabled={!selectedCategory}
                  required
                >
                  <SelectTrigger id="postBreed">
                    <SelectValue placeholder="Select Breed" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategory &&
                      breeds[selectedCategory].map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
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
                    {states.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
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
                      <SelectItem key={`${district}-${index}`} value={district}>
                        {district}
                      </SelectItem>
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
                      {Array.from({ length: 31 }, (_, i) => i).map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year} year{year !== 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select name="ageMonths" value={selectedMonths} onValueChange={setSelectedMonths}>
                    <SelectTrigger>
                      <SelectValue placeholder="Months" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                        <SelectItem key={month} value={String(month)}>
                          {month} month{month !== 1 ? 's' : ''}
                        </SelectItem>
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
                placeholder="Details: Vaccinated, milk yield, weight, health conditions..."
                rows={4}
                value={description}
                onChange={handleDescriptionChange}
                required
              />
              {descriptionError && <p className="text-sm font-medium text-destructive">{descriptionError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postImage">Animal Photo</Label>
              <div className="relative h-56 w-full rounded-md border-2 border-dashed border-border flex items-center justify-center bg-muted/40 overflow-hidden">
                {imagePreview && (
                  <div className="relative w-full h-full">
                    <Image src={imagePreview} alt="Preview" fill className="object-contain rounded-md" />
                  </div>
                )}

                {isVerifyingImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground font-medium">AI verifies animal in image...</p>
                  </div>
                )}

                {!imagePreview && !isVerifyingImage && (
                  <div className="text-center text-muted-foreground p-4">
                    <UploadCloud className="mx-auto h-12 w-12 text-primary/70" />
                    <p className="mt-2 text-sm font-medium">Click below to upload animal photo</p>
                    <p className="text-xs text-muted-foreground">AI automatically verifies that the image contains an animal.</p>
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

            <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 z-20 max-w-2xl mx-auto shadow-md">
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 font-semibold py-6 text-base"
                  disabled={isSubmitDisabled}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Uploading & Posting ({uploadProgress}%)...
                    </>
                  ) : isVerifyingImage ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying Image...
                    </>
                  ) : (
                    'Post Animal'
                  )}
                </Button>
                <Button type="button" variant="outline" className="py-6" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
