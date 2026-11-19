'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import MyUploads from '@/components/my-uploads';
import type { Animal } from '@/lib/definitions';
import { Mail, Phone, User, LogOut, MapPin, Edit3, ShieldCheck, CheckCircle2, PlusCircle, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getFavorites, getStoredAnimals } from '@/lib/animals';
import AnimalCard from './animal-card';

export default function ProfileClient({ myUploads: initialUploads }: { myUploads: Animal[] }) {
  const { user, logout, loading, updateProfile, language } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isTelugu = language === 'te';

  const [uploads, setUploads] = useState<Animal[]>(initialUploads);
  const [favoriteAnimals, setFavoriteAnimals] = useState<Animal[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editVillage, setEditVillage] = useState('');
  const [editDistrict, setEditDistrict] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone);
      setEditVillage(user.village || '');
      setEditDistrict(user.district || '');

      // Refresh stored uploads
      const allAnimals = getStoredAnimals();
      const userPosts = allAnimals.filter(
        (a) => a.uid === user.uid || (user.phone && a.userPhone === user.phone)
      );
      setUploads(userPosts);

      // Load favorites
      const favIds = getFavorites();
      const favList = allAnimals.filter((a) => favIds.includes(a.id));
      setFavoriteAnimals(favList);
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p>{isTelugu ? 'ప్రొఫైల్ లోడ్ అవుతోంది...' : 'Loading profile...'}</p>
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName,
      phone: editPhone,
      village: editVillage,
      district: editDistrict,
    });
    setIsEditDialogOpen(false);
    toast({
      title: isTelugu ? 'ప్రొఫైల్ నవీకరించబడింది' : 'Profile Updated',
      description: isTelugu ? 'మీ వివరాలు విజయవంతంగా భద్రపరచబడ్డాయి.' : 'Your profile details have been saved.',
    });
  };

  const activeCount = uploads.filter((a) => a.status === 'active').length;
  const soldCount = uploads.filter((a) => a.status === 'closed').length;

  return (
    <div className="space-y-6">
      {/* Header Profile Summary Banner */}
      <Card className="bg-gradient-to-r from-emerald-800 to-primary text-white border-none shadow-md overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <Avatar className="h-20 w-20 border-2 border-white/80 shadow-md">
                <AvatarImage src={`https://avatar.vercel.sh/${user.email || user.phone}.png`} alt={user.name} />
                <AvatarFallback className="text-2xl bg-white text-primary font-bold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                  <span className="inline-flex items-center gap-1 bg-white/20 text-xs px-2.5 py-0.5 rounded-full font-medium text-emerald-100">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    {isTelugu ? 'ధ్రువీకరించబడిన రైతు' : 'Verified Seller'}
                  </span>
                </div>
                <p className="text-emerald-100 text-sm flex items-center justify-center sm:justify-start gap-1">
                  <Phone className="w-3.5 h-3.5" /> {user.phone}
                </p>
                {(user.village || user.district) && (
                  <p className="text-emerald-200 text-xs flex items-center justify-center sm:justify-start gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[user.village, user.district, user.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm" className="bg-white/90 text-primary hover:bg-white">
                    <Edit3 className="mr-1.5 h-4 w-4" />
                    {isTelugu ? 'సవరించు' : 'Edit Profile'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isTelugu ? 'ప్రొఫైల్ వివరాలు సవరించండి' : 'Edit Profile'}</DialogTitle>
                    <DialogDescription>
                      {isTelugu
                        ? 'కొనుగోలుదారులకు కనిపించే మీ సమాచారాన్ని నవీకరించండి.'
                        : 'Update your name, contact phone, and location details.'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="editName">{isTelugu ? 'పూర్తి పేరు' : 'Full Name'}</Label>
                      <Input
                        id="editName"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="editPhone">{isTelugu ? 'మొబైల్ నంబర్' : 'Phone Number'}</Label>
                      <Input
                        id="editPhone"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="editVillage">{isTelugu ? 'గ్రామం/పట్టణం' : 'Village'}</Label>
                        <Input
                          id="editVillage"
                          value={editVillage}
                          onChange={(e) => setEditVillage(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="editDistrict">{isTelugu ? 'జిల్లా' : 'District'}</Label>
                        <Input
                          id="editDistrict"
                          value={editDistrict}
                          onChange={(e) => setEditDistrict(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter className="pt-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        {isTelugu ? 'రద్దు' : 'Cancel'}
                      </Button>
                      <Button type="submit">{isTelugu ? 'భద్రపరచు' : 'Save Changes'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={logout}
              >
                <LogOut className="mr-1.5 h-4 w-4" />
                {isTelugu ? 'లాగౌట్' : 'Logout'}
              </Button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-white/20 text-center">
            <div className="bg-white/10 rounded-lg p-2.5">
              <div className="text-xl font-bold">{uploads.length}</div>
              <div className="text-xs text-emerald-100">{isTelugu ? 'మొత్తం ప్రకటనలు' : 'Total Posted'}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2.5">
              <div className="text-xl font-bold text-emerald-200">{activeCount}</div>
              <div className="text-xs text-emerald-100">{isTelugu ? 'అమ్మకంలో ఉన్నవి' : 'Active Ads'}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2.5">
              <div className="text-xl font-bold text-amber-200">{soldCount}</div>
              <div className="text-xs text-emerald-100">{isTelugu ? 'అమ్మబడినవి' : 'Sold'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="uploads" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="uploads" className="font-semibold text-sm">
            {isTelugu ? 'నా పశువులు (Uploads)' : 'My Animal Ads'} ({uploads.length})
          </TabsTrigger>
          <TabsTrigger value="favorites" className="font-semibold text-sm">
            <Heart className="w-4 h-4 mr-1 text-red-500 fill-red-500" />
            {isTelugu ? 'ఇష్టపడినవి (Wishlist)' : 'Favorites'} ({favoriteAnimals.length})
          </TabsTrigger>
          <TabsTrigger value="profile" className="font-semibold text-sm">
            {isTelugu ? 'ఖాతా వివరాలు' : 'Account Info'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="uploads" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">
              {isTelugu ? 'మీరు అమ్మకానికి పెట్టిన పశువులు' : 'Animals You Posted for Sale'}
            </h3>
            <Button asChild size="sm">
              <Link href="/post/new">
                <PlusCircle className="mr-1.5 h-4 w-4" />
                {isTelugu ? 'కొత్త ప్రకటన వేయండి' : 'Post New Animal'}
              </Link>
            </Button>
          </div>
          <MyUploads myUploads={uploads} />
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                {isTelugu ? 'మీరు ఇష్టపడిన పశువులు (Saved Animals)' : 'Your Saved Animals'}
              </CardTitle>
              <CardDescription>
                {isTelugu
                  ? 'మీరు కొనుగోలు చేయడానికి బుక్‌మార్క్ చేసిన పశువుల జాబితా.'
                  : 'Animals you saved for future inquiry and purchase.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {favoriteAnimals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground space-y-3">
                  <p>{isTelugu ? 'మీరు ఇంకా ఏ పశువునూ ఇష్టపడలేదు.' : 'No saved animals in your wishlist yet.'}</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/">{isTelugu ? 'పశువులను చూడండి' : 'Browse Animals'}</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteAnimals.map((animal) => (
                    <AnimalCard key={animal.id} animal={animal} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{isTelugu ? 'వ్యక్తిగత సమాచారం' : 'Personal Details'}</CardTitle>
              <CardDescription>
                {isTelugu ? 'ఈ వివరాలు Animal Bazaar వద్ద భద్రంగా ఉంటాయి.' : 'Your registered account profile.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                  <div className="text-xs text-muted-foreground">{isTelugu ? 'పేరు' : 'Name'}</div>
                  <div className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> {user.name}
                  </div>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                  <div className="text-xs text-muted-foreground">{isTelugu ? 'ఫోన్ నంబర్' : 'Phone'}</div>
                  <div className="font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" /> {user.phone}
                  </div>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                  <div className="text-xs text-muted-foreground">{isTelugu ? 'ఈమెయిల్' : 'Email'}</div>
                  <div className="font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" /> {user.email || 'None'}
                  </div>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                  <div className="text-xs text-muted-foreground">{isTelugu ? 'ప్రాంతం / నివాసం' : 'Location'}</div>
                  <div className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {[user.village, user.district, user.state].filter(Boolean).join(', ') || 'Not specified'}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button variant="outline" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {isTelugu ? 'లాగౌట్ చేయండి' : 'Logout'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
