'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { breeds, animalCategories, type AnimalCategory, type State } from '@/lib/definitions';
import { useAuth } from '@/context/auth-context';
import { addAnimal } from '@/lib/animals';
import { verifyAnimalPhotoStrict } from '@/lib/animal-verifier';
import {
  verifyIndianPinCode,
  detectVerifiedGpsLocation,
  areDistrictsMatching,
  type PostalOfficeItem,
} from '@/lib/address-verifier';
import { VERIFIED_LOCATION_STORAGE_KEY } from '@/components/permissions-onboarding';
import {
  Loader2,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  XCircle,
  Navigation,
  Lock,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function NewPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, language } = useAuth();
  const isTelugu = language === 'te';

  const [selectedCategory, setSelectedCategory] = useState<AnimalCategory>('Cow');
  const [selectedBreed, setSelectedBreed] = useState('');
  const [price, setPrice] = useState('');
  const [priceError, setPriceError] = useState('');

  const [selectedYears, setSelectedYears] = useState('2');
  const [selectedMonths, setSelectedMonths] = useState('0');
  const [description, setDescription] = useState('');

  // Profile-Locked District (User can ONLY post in the district selected when creating their profile)
  const profileDistrict = user?.district?.trim() || '';
  const profileState = (user?.state as State) || '';

  // Verified Address State (No Fake Addresses & No Cross-District Posting Allowed)
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifiedState, setVerifiedState] = useState<State | ''>(profileState);
  const [verifiedDistrict, setVerifiedDistrict] = useState(profileDistrict);
  const [postOffices, setPostOffices] = useState<PostalOfficeItem[]>([]);
  const [selectedVillage, setSelectedVillage] = useState(user?.village || '');
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Strict Animal Photo Verification State
  const [verifiedImageUri, setVerifiedImageUri] = useState<string | null>(null);
  const [isVerifyingImage, setIsVerifyingImage] = useState(false);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);
  const [detectedAnimalLabel, setDetectedAnimalLabel] = useState<string | null>(null);
  const [verificationSuccessMsg, setVerificationSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Camera Modal State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const lockedDist = user.district?.trim() || '';
    const lockedSt = (user.state as State) || '';
    if (lockedDist) setVerifiedDistrict(lockedDist);
    if (lockedSt) setVerifiedState(lockedSt);

    // Pre-populate ONLY within the user's registered profile district
    const initLocation = async () => {
      if (user.pincode && /^[1-9][0-9]{5}$/.test(user.pincode)) {
        await handlePinLookup(user.pincode, user.village, lockedDist);
        return;
      }
      try {
        const cached = localStorage.getItem(VERIFIED_LOCATION_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          const matchesProfile =
            !lockedDist || areDistrictsMatching(parsed?.district, lockedDist, lockedSt);
          if (parsed?.pincode && matchesProfile) {
            setPincode(parsed.pincode);
            if (Array.isArray(parsed.postOffices) && parsed.postOffices.length > 0) {
              setPostOffices(parsed.postOffices);
              setVerifiedState(lockedSt || parsed.state || '');
              setVerifiedDistrict(lockedDist || parsed.district || '');
              setSelectedVillage(parsed.village || parsed.postOffices[0].Name);
              setIsPinVerified(true);
            } else {
              await handlePinLookup(parsed.pincode, parsed.village, lockedDist || parsed.district);
            }
          }
        }
      } catch (e) {
        console.error('Error loading cached location:', e);
      }
    };
    initLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handlePinLookup = async (
    pinToVerify: string,
    preferredVillage?: string,
    preferredDistrict?: string
  ) => {
    const clean = pinToVerify.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);

    const lockedDist = user?.district?.trim() || '';
    const lockedSt = (user?.state as State) || '';

    if (clean.length < 6) {
      setIsPinVerified(false);
      setPostOffices([]);
      setSelectedVillage('');
      setVerifiedState(lockedSt);
      setVerifiedDistrict(lockedDist);
      setPinError(null);
      return;
    }

    setIsVerifyingPin(true);
    setPinError(null);
    const result = await verifyIndianPinCode(clean);
    setIsVerifyingPin(false);

    if (!result.isValid) {
      setIsPinVerified(false);
      setPostOffices([]);
      setSelectedVillage('');
      setVerifiedState(lockedSt);
      setVerifiedDistrict(lockedDist);
      setPinError(isTelugu ? result.errorTe || 'తప్పు పిన్ కోడ్' : result.errorEn || 'Invalid Pin Code');
      return;
    }

    // Strict check: Pin Code MUST belong to the user's registered profile district
    if (lockedDist) {
      const matchingOffices = result.postOffices.filter((po) =>
        areDistrictsMatching(po.District, lockedDist, lockedSt || result.state)
      );
      const pinMatchesProfile =
        areDistrictsMatching(result.district, lockedDist, lockedSt || result.state) ||
        matchingOffices.length > 0;

      // Allow the exact pincode the user registered with during onboarding/profile creation
      const isUserRegisteredPin = Boolean(user?.pincode && user.pincode === clean);

      if (!pinMatchesProfile && !isUserRegisteredPin) {
        setIsPinVerified(false);
        setPostOffices([]);
        setSelectedVillage('');
        setVerifiedState(lockedSt);
        setVerifiedDistrict(lockedDist);
        setPinError(
          isTelugu
            ? `ఈ పిన్ కోడ్ '${result.district}' జిల్లాకు చెందినది. మీ ప్రొఫైల్ జిల్లా '${lockedDist}' మాత్రమే అనుమతించబడుతుంది — వేరే జిల్లాలో పోస్ట్ చేయలేరు.`
            : `This Pin Code belongs to '${result.district}' district. Only your profile district '${lockedDist}' is allowed.`
        );
        return;
      }

      const allowedOffices = matchingOffices.length > 0 ? matchingOffices : result.postOffices;
      setIsPinVerified(true);
      setVerifiedState(lockedSt || result.state);
      setPostOffices(allowedOffices);

      const matchedOffice =
        preferredVillage &&
        allowedOffices.find((po) => po.Name.toLowerCase() === preferredVillage.toLowerCase());
      const chosenOffice = matchedOffice || allowedOffices[0];
      setSelectedVillage(chosenOffice?.Name || '');
      // Always keep district strictly locked to profile district
      setVerifiedDistrict(lockedDist);
      return;
    }

    setIsPinVerified(true);
    setVerifiedState(result.state);
    setPostOffices(result.postOffices);

    const matchedOffice =
      preferredVillage &&
      result.postOffices.find((po) => po.Name.toLowerCase() === preferredVillage.toLowerCase());
    const chosenOffice = matchedOffice || result.postOffices[0];
    setSelectedVillage(chosenOffice?.Name || '');
    setVerifiedDistrict(preferredDistrict || chosenOffice?.District || result.district);
  };

  const handleUseGpsLocation = async () => {
    setIsDetectingGps(true);
    setPinError(null);
    const gps = await detectVerifiedGpsLocation();
    setIsDetectingGps(false);

    if (!gps.success) {
      setPinError(isTelugu ? gps.errorTe || 'GPS విఫలమైంది' : gps.errorEn || 'GPS failed');
      toast({
        variant: 'destructive',
        title: isTelugu ? 'GPS లొకేషన్ లోపం' : 'GPS Location Error',
        description: isTelugu ? gps.errorTe : gps.errorEn,
      });
      return;
    }

    const lockedDist = user?.district?.trim() || '';
    const lockedSt = (user?.state as State) || '';

    // Strict check: Block GPS location if it detects a different district than the user's profile district
    if (lockedDist && gps.district && !areDistrictsMatching(gps.district, lockedDist, lockedSt || gps.state)) {
      const msg = isTelugu
        ? `GPS లో '${gps.district}' జిల్లా గుర్తించబడింది, కానీ మీ ప్రొఫైల్ జిల్లా '${lockedDist}'. వేరే జిల్లాలో పశువును పోస్ట్ చేయడానికి అవకాశం లేదు.`
        : `GPS detected '${gps.district}' district, but your profile is registered in '${lockedDist}'. You can only post in '${lockedDist}'.`;
      setPinError(msg);
      setVerifiedDistrict(lockedDist);
      setVerifiedState(lockedSt);
      toast({
        variant: 'destructive',
        title: isTelugu ? 'వేరే జిల్లా అనుమతించబడదు' : 'Different District Not Allowed',
        description: msg,
      });
      return;
    }

    if (gps.pincode) {
      setPincode(gps.pincode);
    }
    setVerifiedState(lockedSt || gps.state || '');
    setVerifiedDistrict(lockedDist || gps.district || '');

    if (gps.postOffices && gps.postOffices.length > 0) {
      setPostOffices(gps.postOffices);
      setSelectedVillage(gps.village || gps.postOffices[0].Name);
      setIsPinVerified(true);
    } else if (gps.village && (lockedDist || gps.district)) {
      const syntheticOffice: PostalOfficeItem = {
        Name: gps.village,
        Block: lockedDist || gps.district || '',
        District: lockedDist || gps.district || '',
        State: lockedSt || gps.state || 'Telangana',
        Pincode: gps.pincode || '500001',
      };
      setPostOffices([syntheticOffice]);
      setSelectedVillage(gps.village);
      setIsPinVerified(true);
    }

    toast({
      title: isTelugu ? 'GPS చిరునామా ధ్రువీకరించబడింది ✓' : 'GPS Address Verified ✓',
      description: `${gps.village || ''}, ${lockedDist || gps.district || ''} (${gps.pincode || ''})`,
    });
  };

  // Run strict AI verification BEFORE allowing any image to be uploaded into verifiedImageUri
  const processCandidateImageDataUri = async (
    dataUri: string,
    categoryToCheck: AnimalCategory
  ) => {
    setImageValidationError(null);
    setVerificationSuccessMsg(null);
    setDetectedAnimalLabel(null);
    // Crucial: Clear any previous uploaded image while verifying
    setVerifiedImageUri(null);
    setIsVerifyingImage(true);

    try {
      const outcome = await verifyAnimalPhotoStrict(dataUri, categoryToCheck);

      if (!outcome.containsAnimal || !outcome.matchesCategory) {
        // Strictly block upload
        setVerifiedImageUri(null);
        setDetectedAnimalLabel(outcome.detectedAnimal);
        const msg = isTelugu ? outcome.reasonTe : outcome.reasonEn;
        setImageValidationError(msg);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        toast({
          variant: 'destructive',
          title: isTelugu ? 'ఫోటో తిరస్కరించబడింది (Photo Rejected)' : 'Photo Rejected — Not an Animal',
          description: msg,
        });
        return;
      }

      // ONLY after verification succeeds do we set verifiedImageUri (upload accepted)
      setVerifiedImageUri(dataUri);
      setDetectedAnimalLabel(outcome.detectedAnimal);
      const okMsg = isTelugu ? outcome.reasonTe : outcome.reasonEn;
      setVerificationSuccessMsg(okMsg);
      toast({
        title: isTelugu ? 'పశువు ఫోటో ధ్రువీకరించబడింది ✓' : 'Animal Photo Verified ✓',
        description: okMsg,
      });
    } catch (error) {
      console.error('Image verification error:', error);
      setVerifiedImageUri(null);
      setImageValidationError(
        isTelugu
          ? 'ఫోటోలో పశువును ధ్రువీకరించడం సాధ్యం కాలేదు. దయచేసి స్పష్టమైన పశువు ఫోటోను ఎంచుకోండి.'
          : 'Could not verify an animal in the photo. Please select a clear photo of an animal.'
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsVerifyingImage(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageValidationError(
        isTelugu ? 'దయచేసి చెల్లుబాటు అయ్యే ఫోటో ఫైల్ మాత్రమే ఎంచుకోండి.' : 'Please select a valid image file.'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUri = reader.result as string;
      await processCandidateImageDataUri(dataUri, selectedCategory);
    };
    reader.readAsDataURL(file);
  };

  // Re-verify existing photo if user switches animal category
  const handleCategoryChange = async (newCat: AnimalCategory) => {
    setSelectedCategory(newCat);
    setSelectedBreed('');
    if (verifiedImageUri) {
      await processCandidateImageDataUri(verifiedImageUri, newCat);
    }
  };

  // Live Camera Capture Handlers
  const startLiveCamera = async () => {
    setImageValidationError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'కెమెరా అందుబాటులో లేదు' : 'Camera Unavailable',
        description: isTelugu
          ? 'మీ బ్రౌజర్‌లో కెమెరా సపోర్ట్ లేదు. గ్యాలరీ నుండి ఫోటో ఎంచుకోండి.'
          : 'Camera not supported in this browser. Please choose from gallery.',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.error('Video play error:', err));
        }
      }, 100);
    } catch {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'కెమెరా అనుమతి అవసరం' : 'Camera Permission Denied',
        description: isTelugu
          ? 'కెమెరాతో ఫోటో తీయడానికి దయచేసి బ్రౌజర్‌లో కెమెరా అనుమతి ఇవ్వండి లేదా గ్యాలరీ ఉపయోగించండి.'
          : 'Please allow camera permission in your browser settings or use Gallery.',
      });
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const captureCameraFrame = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg', 0.88);
    stopLiveCamera();
    await processCandidateImageDataUri(dataUri, selectedCategory);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (Number(value) > 9999999) {
      setPriceError(isTelugu ? 'ధర పరిమితి మించింది.' : 'Price exceeds limit.');
    } else {
      setPriceError('');
    }
    setPrice(value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!verifiedImageUri || isVerifyingImage || imageValidationError) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'ధ్రువీకరించబడిన పశువు ఫోటో తప్పనిసరి' : 'Verified Animal Photo Required',
        description: isTelugu
          ? 'పశువు ఉన్న ఫోటోను అప్‌లోడ్ చేసి, AI ధ్రువీకరణ పూర్తయిన తర్వాత మాత్రమే పోస్ట్ చేయగలరు.'
          : 'You must upload a verified animal photo before posting.',
      });
      return;
    }

    if (!isPinVerified || !verifiedDistrict || !selectedVillage) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'నిజమైన చిరునామా ధ్రువీకరణ అవసరం' : 'Verified Address Required',
        description: isTelugu
          ? 'దయచేసి సరైన 6 అంకెల పిన్ కోడ్ లేదా GPS లొకేషన్ ద్వారా మీ నిజమైన గ్రామాన్ని ఎంచుకోండి.'
          : 'Please verify your 6-digit Pin Code or GPS location and select a valid village.',
      });
      return;
    }

    const finalDistrict = profileDistrict || verifiedDistrict;
    if (profileDistrict && !areDistrictsMatching(verifiedDistrict, profileDistrict, profileState)) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'జిల్లా సరిపోలడం లేదు' : 'District Mismatch',
        description: isTelugu
          ? `మీ ప్రొఫైల్ జిల్లా '${profileDistrict}' లో మాత్రమే పశువును పోస్ట్ చేయగలరు.`
          : `You can only post animals in your registered profile district '${profileDistrict}'.`,
      });
      return;
    }

    if (priceError || !price) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'ధర సరికాదు' : 'Invalid Price',
        description: priceError || (isTelugu ? 'దయచేసి ధర నమోదు చేయండి' : 'Please enter a valid price.'),
      });
      return;
    }

    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const breedValue = selectedBreed || (formData.get('breed') as string);
    const finalBreed =
      breedValue === 'Other'
        ? (formData.get('otherBreed') as string) || 'Desi'
        : breedValue || 'Desi';

    const fullLocation = `${selectedVillage}, ${finalDistrict}`;
    const title = `${finalBreed} ${selectedCategory} in ${finalDistrict}`;

    const years = parseInt(selectedYears, 10);
    const months = parseInt(selectedMonths, 10);
    let ageString = '';
    if (years > 0) ageString += `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) ageString += ` ${months} month${months > 1 ? 's' : ''}`;
    if (!ageString.trim()) ageString = '1 year';

    addAnimal({
      id: 'post_' + Date.now().toString(),
      uid: user.uid,
      userName: user.name,
      userPhone: user.phone,
      title,
      category: selectedCategory,
      breed: finalBreed,
      age: ageString.trim(),
      price: Number(price),
      location: finalDistrict,
      desc:
        `${description ? description + ' — ' : ''}చిరునామా: ${fullLocation}, ${verifiedState || profileState} (${pincode})`.trim(),
      imageUrl: verifiedImageUri,
      imageHint: `${finalBreed} ${selectedCategory}`,
      status: 'active',
      createdAt: Date.now(),
      featured: true,
    });

    toast({
      title: isTelugu ? 'ప్రకటన విజయవంతంగా పోస్ట్ అయింది!' : 'Animal Posted Successfully!',
      description: isTelugu
        ? 'ధ్రువీకరించబడిన పశువు ఫోటో మరియు నిజమైన చిరునామాతో మీ ప్రకటన బజార్‌లో చేర్చబడింది.'
        : 'Your verified animal listing is now live in the marketplace.',
    });
    router.push('/profile');
  };

  if (!user) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        {isTelugu ? 'లాగిన్ పేజీకి మళ్ళించబడుతోంది...' : 'Redirecting to login...'}
      </div>
    );
  }

  const canSubmit =
    Boolean(verifiedImageUri) &&
    !isVerifyingImage &&
    !imageValidationError &&
    isPinVerified &&
    Boolean(selectedVillage) &&
    Boolean(selectedBreed) &&
    Boolean(price);

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            {isTelugu ? 'పశువును అమ్మకానికి పెట్టండి' : 'Post Animal for Sale'}
          </CardTitle>
          <CardDescription>
            {isTelugu
              ? 'గమనిక: పశువు ఉన్న ఫోటో మాత్రమే AI తనిఖీ తర్వాత అప్‌లోడ్ అవుతుంది. నకిలీ చిరునామాలు అనుమతించబడవు.'
              : 'Strict verification: Only verified animal photos and genuine Pin Code / GPS locations are accepted.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Animal Type & Breed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postCategory" className="font-semibold">
                  {isTelugu ? '1. పశువు రకం (Animal Type)' : '1. Animal Category'} *
                </Label>
                <Select
                  name="category"
                  value={selectedCategory}
                  onValueChange={(value) => handleCategoryChange(value as AnimalCategory)}
                  required
                >
                  <SelectTrigger id="postCategory">
                    <SelectValue placeholder="రకం ఎంచుకోండి" />
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
                <Label htmlFor="postBreed" className="font-semibold">
                  {isTelugu ? '2. జాతి (Breed)' : '2. Breed'} *
                </Label>
                <Select
                  name="breed"
                  value={selectedBreed}
                  onValueChange={setSelectedBreed}
                  disabled={!selectedCategory}
                  required
                >
                  <SelectTrigger id="postBreed">
                    <SelectValue placeholder={isTelugu ? 'జాతి ఎంచుకోండి' : 'Select Breed'} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategory &&
                      breeds[selectedCategory].map((breed) => (
                        <SelectItem key={breed} value={breed}>
                          {breed}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedBreed === 'Other' && (
              <div className="space-y-2">
                <Label htmlFor="otherBreed">{isTelugu ? 'జాతి పేరు రాయండి' : 'Specify Breed Name'} *</Label>
                <Input id="otherBreed" name="otherBreed" placeholder="ఉదా: ఒంగోలు / పుంగనూరు" required />
              </div>
            )}

            {/* 2. Strict Animal Photo Verification Section */}
            <div className="p-4 rounded-xl border-2 border-primary/25 bg-muted/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label className="font-bold text-base flex items-center gap-1.5">
                    {isTelugu
                      ? `3. పశువు ఫోటో అప్‌లోడ్ (${selectedCategory} ఫోటో మాత్రమే) *`
                      : `3. Upload ${selectedCategory} Photo (Animal Only) *`}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isTelugu
                      ? 'ఫోటోలో పశువు ఉందో లేదో AI తనిఖీ చేసిన తర్వాత మాత్రమే అప్‌లోడ్ పూర్తవుతుంది.'
                      : 'Photo will be uploaded ONLY after AI verifies that an animal is present.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startLiveCamera}
                    disabled={isVerifyingImage}
                  >
                    <Camera className="w-4 h-4 mr-1.5 text-primary" />
                    {isTelugu ? 'కెమెరా' : 'Camera'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isVerifyingImage}
                  >
                    <ImageIcon className="w-4 h-4 mr-1.5 text-primary" />
                    {isTelugu ? 'గ్యాలరీ' : 'Gallery'}
                  </Button>
                </div>
              </div>

              {/* Live Camera Viewport if opened */}
              {isCameraOpen && (
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex flex-col items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <div className="absolute bottom-3 inset-x-0 flex justify-center gap-3">
                    <Button type="button" onClick={captureCameraFrame} className="font-bold shadow-lg">
                      <Camera className="w-4 h-4 mr-1.5" />
                      {isTelugu ? 'ఫోటో తీయండి' : 'Capture Photo'}
                    </Button>
                    <Button type="button" variant="destructive" onClick={stopLiveCamera}>
                      {isTelugu ? 'మూసివేయి' : 'Close'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Photo Verification & Preview Box */}
              <div
                onClick={() => !isVerifyingImage && !isCameraOpen && fileInputRef.current?.click()}
                className={`relative h-56 w-full rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors cursor-pointer ${
                  verifiedImageUri
                    ? 'border-emerald-500 bg-emerald-50/20'
                    : imageValidationError
                    ? 'border-destructive bg-destructive/5'
                    : 'border-primary/30 bg-background hover:bg-muted/40'
                }`}
              >
                {/* Show scanning state BEFORE accepting upload */}
                {isVerifyingImage && (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="font-bold text-sm text-foreground">
                      {isTelugu
                        ? 'ఫోటోలో పశువు ఉందా లేదా అని AI తనిఖీ చేస్తోంది...'
                        : 'Verifying if photo contains an animal...'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isTelugu
                        ? 'పశువు ధ్రువీకరించబడిన తర్వాత మాత్రమే ఫోటో అప్‌లోడ్ అవుతుంది.'
                        : 'Photo will only upload after animal detection succeeds.'}
                    </p>
                  </div>
                )}

                {/* Show image ONLY AFTER verification succeeded */}
                {!isVerifyingImage && verifiedImageUri && (
                  <div className="relative w-full h-full">
                    <Image
                      src={verifiedImageUri}
                      alt="Verified Animal"
                      fill
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-md shadow flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {isTelugu
                        ? `అప్‌లోడ్ అయింది: ${detectedAnimalLabel || selectedCategory}`
                        : `Uploaded: ${detectedAnimalLabel || selectedCategory}`}
                    </div>
                  </div>
                )}

                {/* Empty / Rejected state */}
                {!isVerifyingImage && !verifiedImageUri && (
                  <div className="text-center text-muted-foreground p-4 space-y-1.5">
                    {imageValidationError ? (
                      <XCircle className="mx-auto h-11 w-11 text-destructive" />
                    ) : (
                      <UploadCloud className="mx-auto h-11 w-11 text-primary/70" />
                    )}
                    <p className="text-sm font-semibold text-foreground">
                      {imageValidationError
                        ? isTelugu
                          ? 'ఫోటో అప్‌లోడ్ నిలిపివేయబడింది! మరొక పశువు ఫోటోను ఎంచుకోండి'
                          : 'Upload blocked! Click to select a real animal photo'
                        : isTelugu
                        ? 'పశువు ఫోటో ఎంచుకోవడానికి ఇక్కడ క్లిక్ చేయండి'
                        : 'Click here to select or capture animal photo'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isTelugu
                        ? 'మనుషుల ఫోటోలు, వాహనాలు లేదా ఇతర ఫోటోలు అప్‌లోడ్ కావు.'
                        : 'Human selfies, vehicles, documents, or non-animal photos are strictly rejected.'}
                    </p>
                  </div>
                )}
              </div>

              <Input
                ref={fileInputRef}
                name="image"
                id="postImage"
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {verificationSuccessMsg && verifiedImageUri && (
                <Alert className="border-emerald-500 bg-emerald-50 text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  <AlertTitle className="font-bold">
                    {isTelugu ? 'పశువు ఫోటో అప్‌లోడ్ పూర్తయింది ✓' : 'Animal Photo Verified & Uploaded ✓'}
                  </AlertTitle>
                  <AlertDescription className="text-xs">{verificationSuccessMsg}</AlertDescription>
                </Alert>
              )}

              {imageValidationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="font-bold">
                    {isTelugu
                      ? 'ఈ ఫోటో అప్‌లోడ్ కాదు (పశువు ఫోటో మాత్రమే ఉండాలి)'
                      : 'Upload Rejected — Animal Photo Required'}
                  </AlertTitle>
                  <AlertDescription className="text-xs font-medium">{imageValidationError}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* 3. Real Address & Pin Code Verification Section (No Fake Address Allowed) */}
            <div className="p-4 rounded-xl border border-primary/25 bg-muted/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label className="font-bold text-base flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    {isTelugu
                      ? '4. నిజమైన చిరునామా ధ్రువీకరణ (Pin Code / GPS) *'
                      : '4. Verified Location (Pin Code / GPS) *'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isTelugu
                      ? 'నకిలీ చిరునామా నమోదు చేయడానికి అవకాశం లేదు. పిన్ కోడ్ లేదా GPS ఉపయోగించండి.'
                      : 'Fake addresses are disabled. Enter your real 6-digit Pin Code or use GPS.'}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseGpsLocation}
                  disabled={isDetectingGps}
                  className="shrink-0"
                >
                  {isDetectingGps ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-primary" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  )}
                  {isTelugu ? 'GPS లొకేషన్ తీసుకోండి' : 'Use GPS Location'}
                </Button>
              </div>

              {profileDistrict && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold">
                  <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    {isTelugu
                      ? `మీ ప్రొఫైల్ జిల్లా '${profileDistrict}' లాక్ చేయబడింది. ఈ జిల్లాలోని పిన్ కోడ్ / గ్రామం మాత్రమే అనుమతించబడుతుంది.`
                      : `Locked to your Profile District: ${profileDistrict}. Only Pin Codes and villages in this district are allowed.`}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pincode" className="text-sm font-semibold">
                    {isTelugu ? '6-అంకెల పిన్ కోడ్ (Pin Code)' : '6-Digit Pin Code'} *
                  </Label>
                  <div className="relative">
                    <Input
                      id="pincode"
                      type="text"
                      maxLength={6}
                      placeholder="ఉదా: 500001, 522001"
                      value={pincode}
                      onChange={(e) => handlePinLookup(e.target.value)}
                      required
                      className={`font-mono tabular-nums h-10 ${
                        isPinVerified ? 'border-emerald-500 bg-emerald-50/40' : ''
                      }`}
                    />
                    {isVerifyingPin && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary absolute right-3 top-3" />
                    )}
                  </div>
                  {pinError && <p className="text-xs text-destructive font-semibold">{pinError}</p>}
                  {isPinVerified && (
                    <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isTelugu ? 'అధికారిక పోస్టల్ పిన్ కోడ్ ధ్రువీకరించబడింది' : 'Verified India Post Pin Code'}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="postVillage" className="text-sm font-semibold">
                    {isTelugu ? 'గ్రామం / పోస్టాఫీసు (Verified Village)' : 'Verified Village / Locality'} *
                  </Label>
                  <Select
                    value={selectedVillage}
                    onValueChange={(val) => {
                      setSelectedVillage(val);
                      if (!profileDistrict) {
                        const po = postOffices.find((item) => item.Name === val);
                        if (po?.District) {
                          setVerifiedDistrict(po.District);
                        }
                      }
                    }}
                    disabled={!isPinVerified || postOffices.length === 0}
                    required
                  >
                    <SelectTrigger id="postVillage" className="h-10">
                      <SelectValue
                        placeholder={
                          isPinVerified
                            ? isTelugu
                              ? 'గ్రామాన్ని ఎంచుకోండి'
                              : 'Select Village'
                            : isTelugu
                            ? 'ముందుగా పిన్ కోడ్ ఇవ్వండి'
                            : 'Enter Pin Code first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {postOffices.map((po, idx) => (
                        <SelectItem key={`${po.Name}-${idx}`} value={po.Name}>
                          {po.Name} {po.Block ? `(${po.Block})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-700" />
                    {isTelugu ? 'జిల్లా (Profile District - Locked)' : 'Profile District (Locked)'}
                  </Label>
                  <Input
                    value={profileDistrict || verifiedDistrict}
                    readOnly
                    disabled
                    placeholder={isTelugu ? 'ప్రొఫైల్ జిల్లా ఆటోమేటిక్‌గా వస్తుంది' : 'Locked to profile district'}
                    className="bg-muted font-semibold h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-700" />
                    {isTelugu ? 'రాష్ట్రం (Profile State - Locked)' : 'Profile State (Locked)'}
                  </Label>
                  <Input
                    value={profileState || verifiedState}
                    readOnly
                    disabled
                    placeholder={isTelugu ? 'పిన్ కోడ్ ద్వారా ఆటోమేటిక్‌గా వస్తుంది' : 'Auto-filled from Pin Code'}
                    className="bg-muted font-semibold h-9"
                  />
                </div>
              </div>
            </div>

            {/* 4. Price & Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postPrice" className="font-semibold">
                  {isTelugu ? '5. ధర (Price in ₹)' : '5. Price (₹)'} *
                </Label>
                <Input
                  name="price"
                  id="postPrice"
                  type="number"
                  placeholder="ఉదా: 75000"
                  value={price}
                  onChange={handlePriceChange}
                  required
                  className="h-10 text-base tabular-nums"
                />
                {priceError && <p className="text-xs font-medium text-destructive">{priceError}</p>}
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">{isTelugu ? '6. వయస్సు (Age)' : '6. Age'}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select name="ageYears" value={selectedYears} onValueChange={setSelectedYears}>
                    <SelectTrigger>
                      <SelectValue placeholder="Years" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(21).keys()].map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year} {isTelugu ? 'సంవత్సరాలు' : `year${year !== 1 ? 's' : ''}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select name="ageMonths" value={selectedMonths} onValueChange={setSelectedMonths}>
                    <SelectTrigger>
                      <SelectValue placeholder="Months" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(12).keys()].map((month) => (
                        <SelectItem key={month} value={String(month)}>
                          {month} {isTelugu ? 'నెలలు' : `month${month !== 1 ? 's' : ''}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 5. Description */}
            <div className="space-y-2">
              <Label htmlFor="postDesc" className="font-semibold">
                {isTelugu ? '7. పశువు వివరాలు (Description)' : '7. Animal Details'}
              </Label>
              <Textarea
                name="description"
                id="postDesc"
                rows={3}
                placeholder={
                  isTelugu
                    ? 'ఉదా: పాల సామర్థ్యం రోజుకి 18 లీటర్లు, ఆరోగ్యంగా ఉంది, టీకాలు వేశారు...'
                    : 'Details: Milk yield, vaccination status, health, lactation...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="pt-4 flex gap-4">
              <Button
                type="submit"
                className="flex-1 h-12 text-base font-bold shadow-md"
                disabled={!canSubmit}
              >
                {isVerifyingImage ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                )}
                {isTelugu ? 'పశువును అమ్మకానికి పోస్ట్ చేయండి' : 'Post Verified Animal for Sale'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-bold text-base shadow-md"
                onClick={() => router.back()}
              >
                {isTelugu ? 'రద్దు' : 'Cancel'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
