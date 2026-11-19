'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import AnimalCard from './animal-card';
import type { Animal, State, AnimalCategory } from '@/lib/definitions';
import { locations, states, allDistricts, animalCategories } from '@/lib/definitions';
import { Search, Plus, Filter, Sparkles, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { getStoredAnimals } from '@/lib/animals';
import { AnimalIcon } from './animal-icon';

type HomeClientProps = {
  initialPosts: Animal[];
  searchParams: {
    q?: string;
    category?: AnimalCategory | 'all';
    state?: State | 'all';
    district?: string;
  };
};

const categoryLabelsTelugu: Record<AnimalCategory, string> = {
  Cow: 'ఆవులు (Cow)',
  Buffalo: 'గేదెలు (Buffalo)',
  Ox: 'ఎద్దులు (Ox)',
  Goat: 'మేకలు (Goat)',
  Sheep: 'గొర్రెలు (Sheep)',
  Hen: 'నాటు కోళ్ళు (Hen)',
  Dog: 'కుక్కలు (Dog)',
  Cat: 'పిల్లులు (Cat)',
  Pig: 'పందులు (Pig)',
  Pigeon: 'పావురాలు (Pigeon)',
};

export default function HomeClient({ initialPosts, searchParams }: HomeClientProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const { user, language } = useAuth();
  const isTelugu = language === 'te';

  const [posts, setPosts] = useState<Animal[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState(searchParams.q || '');
  const [selectedCategory, setSelectedCategory] = useState<AnimalCategory | 'all'>(searchParams.category || 'all');
  const [selectedState, setSelectedState] = useState<State | 'all'>(searchParams.state || 'all');
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.district || 'all');
  const [districts, setDistricts] = useState<string[]>([]);

  // Sync client-side with localStorage so newly created animals appear immediately
  useEffect(() => {
    try {
      const stored = getStoredAnimals();
      if (stored && stored.length > 0) {
        setPosts(stored);
      }
    } catch (err) {
      console.error('Failed to sync stored animals:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedState === 'all') {
      setDistricts(allDistricts);
    } else {
      setDistricts(locations[selectedState as State] || []);
    }
  }, [selectedState]);

  const updateSearch = (newParams: Partial<HomeClientProps['searchParams']>) => {
    const params = new URLSearchParams(currentSearchParams ? currentSearchParams.toString() : '');

    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/?${params.toString()}`);
  };

  const handleCategoryChange = (value: AnimalCategory | 'all') => {
    setSelectedCategory(value);
    updateSearch({ category: value, q: searchQuery, state: selectedState, district: selectedDistrict });
  };

  const handleStateChange = (value: State | 'all') => {
    setSelectedState(value);
    setSelectedDistrict('all');
    updateSearch({ state: value, district: 'all', q: searchQuery, category: selectedCategory });
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    updateSearch({ district: value, q: searchQuery, category: selectedCategory, state: selectedState });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateSearch({ q: searchQuery, category: selectedCategory, state: selectedState, district: selectedDistrict });
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedState('all');
    setSelectedDistrict('all');
    router.push('/');
  };

  // Filter posts based on client query
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.breed.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (selectedState && selectedState !== 'all') {
      const districtsInState = locations[selectedState as State] || [];
      result = result.filter((p) => districtsInState.includes(p.location));
    }

    if (selectedDistrict && selectedDistrict !== 'all') {
      result = result.filter((p) => p.location.toLowerCase() === selectedDistrict.toLowerCase());
    }

    return result;
  }, [posts, searchQuery, selectedCategory, selectedState, selectedDistrict]);

  const activePosts = useMemo(() => filteredPosts.filter((p) => p.status === 'active'), [filteredPosts]);

  const featuredPosts = useMemo(() => {
    const featured = activePosts.filter((p) => p.featured);
    return featured.length > 0 ? featured.slice(0, 4) : activePosts.slice(0, 4);
  }, [activePosts]);

  const recentPosts = useMemo(() => activePosts.slice(0, 24), [activePosts]);

  const popularCategories: AnimalCategory[] = ['Cow', 'Buffalo', 'Ox', 'Goat', 'Sheep', 'Hen'];

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-primary text-white p-6 sm:p-8 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            {isTelugu ? 'రైతుల కోసం నిజమైన పశువుల సంత' : 'Real Livestock Trading Platform'}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            {isTelugu ? 'పశువుల బజార్ - కొనుగోలు & అమ్మకం' : 'Animal Bazaar - Buy & Sell Livestock'}
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            {isTelugu
              ? 'ఆవులు, గేదెలు, ఎద్దులు, గొర్రెలు, మేకలు, నాటు కోళ్ళను నేరుగా రైతుల నుండి కొనుగోలు చేయండి లేదా మీ పశువులను ఉచితంగా అమ్మకానికి పెట్టండి.'
              : 'Direct connection between livestock farmers and buyers. Zero broker fee, 100% genuine local breeds.'}
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            {user ? (
              <Button
                asChild
                className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold h-11 px-5 shadow-sm"
              >
                <Link href="/post/new">
                  <Plus className="mr-1.5 h-5 w-5" />
                  {isTelugu ? 'పశువును అమ్మకానికి పెట్టండి' : 'Post Animal for Sale'}
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold h-11 px-5 shadow-sm"
              >
                <Link href="/login">
                  {isTelugu ? 'పశువును అమ్మడానికి లాగిన్ అవ్వండి' : 'Login to Sell Animals'}
                </Link>
              </Button>
            )}
            {!user && (
              <Button
                asChild
                variant="outline"
                className="bg-transparent border-white/60 text-white hover:bg-white/10 h-11 px-5"
              >
                <Link href="/register">
                  {isTelugu ? 'రైతు ఖాతా తెరవండి' : 'Register Account'}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Category Icons Quick Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {isTelugu ? 'ప్రధాన వర్గాలు (Categories)' : 'Popular Livestock Categories'}
          </h2>
          {selectedCategory !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => handleCategoryChange('all')} className="text-xs text-primary">
              {isTelugu ? 'అన్నిటినీ చూపించు' : 'Show All'}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {popularCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(isSelected ? 'all' : cat)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground shadow-md scale-105'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className={`p-2 rounded-full mb-1 ${isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                  <AnimalIcon category={cat} className="h-6 w-6" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">
                  {isTelugu ? categoryLabelsTelugu[cat]?.split(' ')[0] : cat}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and District Filters */}
      <Card className="bg-[#F1F8E9] border-emerald-200 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="searchInput"
              placeholder={
                isTelugu
                  ? 'పేరు, జాతి, ఊరు లేదా జిల్లాతో వెతకండి (ఉదా: ముర్రా, ఒంగోలు, హైదరాబాద్)...'
                  : 'Search by breed, name, district (e.g. Murrah, Ongole, Guntur)...'
              }
              className="pl-10 bg-white h-11 text-base shadow-inner border-emerald-300"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchOnEnter}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="bg-white h-10 border-emerald-300">
                <SelectValue placeholder={isTelugu ? 'అన్ని రకాలు' : 'All Categories'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isTelugu ? 'అన్ని వర్గాలు (All)' : 'All Categories'}</SelectItem>
                {animalCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {isTelugu ? categoryLabelsTelugu[cat] || cat : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedState} onValueChange={handleStateChange}>
              <SelectTrigger className="bg-white h-10 border-emerald-300">
                <SelectValue placeholder={isTelugu ? 'రాష్ట్రం' : 'All States'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isTelugu ? 'అన్ని రాష్ట్రాలు' : 'All States'}</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedDistrict}
              onValueChange={handleDistrictChange}
              disabled={selectedState === 'all'}
            >
              <SelectTrigger className="bg-white h-10 border-emerald-300">
                <SelectValue placeholder={isTelugu ? 'జిల్లా' : 'All Districts'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isTelugu ? 'అన్ని జిల్లాలు' : 'All Districts'}</SelectItem>
                {districts.map((district, index) => (
                  <SelectItem key={`${district}-${index}`} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center pt-1 text-xs sm:text-sm text-muted-foreground">
            <span>
              {isTelugu ? 'ఫలితాలు:' : 'Showing:'}{' '}
              <strong className="text-foreground">{activePosts.length}</strong>{' '}
              {isTelugu ? 'పశువులు అందుబాటులో ఉన్నాయి' : 'active listings available'}
            </span>
            <Button onClick={resetFilters} variant="link" className="text-primary text-xs sm:text-sm p-0 h-auto">
              {isTelugu ? 'ఫిల్టర్లు రీసెట్ చేయండి' : 'Reset Filters'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Featured Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
            {isTelugu ? 'ప్రత్యేక పశువులు (Featured Animals)' : 'Featured Animals'}
          </h2>
        </div>
        {featuredPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {featuredPosts.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-muted/40 rounded-xl text-muted-foreground">
            {isTelugu ? 'ఎంచుకున్న ఫిల్టర్లతో ప్రత్యేక పశువులు కనుగొనబడలేదు.' : 'No featured animals match your criteria.'}
          </div>
        )}
      </div>

      {/* All Available Animals Grid */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">
          {isTelugu ? 'ఇటీవల చేర్చిన పశువులు (All Listings)' : 'Recent Marketplace Listings'}
        </h2>
        {recentPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {recentPosts.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-14 bg-muted/30 rounded-2xl border border-dashed p-6 space-y-3">
            <p className="text-muted-foreground text-base">
              {isTelugu ? 'ఈ శోధనకు ఎటువంటి పశువులు కనుగొనబడలేదు.' : 'No animals found matching your search.'}
            </p>
            <Button onClick={resetFilters} variant="outline" size="sm">
              {isTelugu ? 'అన్ని పశువులను చూడండి' : 'Show All Animals'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
