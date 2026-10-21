
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import AnimalCard from './animal-card';
import type { Animal, State, AnimalCategory } from '@/lib/definitions';
import { locations, states, allDistricts, animalCategories } from '@/lib/definitions';
import { Search, Plus } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';


type HomeClientProps = {
    initialPosts: Animal[];
    searchParams: {
        q?: string;
        category?: AnimalCategory | 'all';
        state?: State | 'all';
        district?: string;
    };
};


export default function HomeClient({ initialPosts, searchParams }: HomeClientProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState(searchParams.q || '');
  const [selectedCategory, setSelectedCategory] = useState<AnimalCategory | 'all'>(searchParams.category || 'all');
  const [selectedState, setSelectedState] = useState<State | 'all'>(searchParams.state || 'all');
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.district || 'all');
  
  const [districts, setDistricts] = useState<string[]>([]);
  
  useEffect(() => {
    if (selectedState === 'all') {
      setDistricts(allDistricts);
    } else {
      setDistricts(locations[selectedState as State] || []);
    }
  }, [selectedState]);


  const updateSearch = (newParams: Partial<HomeClientProps['searchParams']>) => {
    const params = new URLSearchParams(currentSearchParams);
    
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
    setSelectedDistrict('all'); // Reset district when state changes
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
  }

  const activePosts = useMemo(() => initialPosts.filter(p => p.status === 'active'), [initialPosts]);

  const featuredPosts = useMemo(() => {
    const featured = activePosts.filter(p => p.featured);
    return featured.length > 0 ? featured.slice(0, 4) : activePosts.slice(0, 4);
  }, [activePosts]);

  const recentPosts = useMemo(() => activePosts.slice(0, 20), [activePosts]);

  return (
    <div className="space-y-8">
      <Card className="bg-[#F1F8E9]">
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="searchInput"
              placeholder="Search name, breed..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchOnEnter}
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {animalCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedState} onValueChange={handleStateChange}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDistrict} onValueChange={handleDistrictChange} disabled={selectedState === 'all'}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map((district, index) => (
                  <SelectItem key={`${district}-${index}`} value={district}>{district}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex justify-between items-center'>
            <p className="text-sm text-muted-foreground">
              Showing animals from all users.
            </p>
            <Button onClick={resetFilters} variant="link" className="text-primary">Reset Filters</Button>
          </div>
        </CardContent>
      </Card>
      
      {user && (
        <div className="flex justify-end my-4">
            <Button
              asChild
              className="h-16 w-16 rounded-full shadow-lg"
              aria-label="Post new animal"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                boxShadow: '0 8px 30px hsla(var(--primary), 0.25)',
              }}
            >
              <Link href="/post/new">
                <Plus className="h-8 w-8" />
              </Link>
            </Button>
        </div>
      )}


      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Featured Animals</h2>
        {featuredPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredPosts.map(animal => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No featured animals found.</p>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Recently Added</h2>
        {recentPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentPosts.map(animal => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No recent animals to show.</p>
        )}
      </div>
    </div>
  );
}
