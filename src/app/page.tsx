import HomeClient from '@/components/home-client';
import { animals as allPostsData } from '@/lib/animals';
import { locations } from '@/lib/definitions';
import type { Animal, State, AnimalCategory } from '@/lib/definitions';

type SearchParamsData = {
  q?: string;
  category?: AnimalCategory | 'all';
  state?: State | 'all';
  district?: string;
};

type HomePageProps = {
  searchParams: Promise<SearchParamsData>;
};

const filterAnimals = (searchParams: SearchParamsData): Animal[] => {
  const { q, category, state, district } = searchParams;

  let filteredPosts = [...allPostsData].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  filteredPosts = filteredPosts.filter((post) => {
    const isRecent = post.createdAt > Date.now() - 45 * 24 * 60 * 60 * 1000;
    return isRecent;
  });

  if (q) {
    const query = q.toLowerCase();
    filteredPosts = filteredPosts.filter((post) =>
      `${post.title} ${post.breed} ${post.location}`.toLowerCase().includes(query)
    );
  }

  if (category && category !== 'all') {
    filteredPosts = filteredPosts.filter((post) => post.category === category);
  }

  if (state && state !== 'all') {
    const districtsInState = locations[state];
    if (districtsInState) {
      filteredPosts = filteredPosts.filter((post) => districtsInState.includes(post.location));
    }
  }

  if (district && district !== 'all') {
    filteredPosts = filteredPosts.filter((post) => post.location === district);
  }

  return filteredPosts;
};

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const visiblePosts = filterAnimals(resolvedSearchParams);

  return (
    <HomeClient initialPosts={visiblePosts} searchParams={resolvedSearchParams} />
  );
}
