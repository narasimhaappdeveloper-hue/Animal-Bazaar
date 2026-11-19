import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Animal Bazaar - పశువుల బజార్',
    short_name: 'AnimalBazaar',
    description:
      'Real livestock & animal marketplace to buy and sell cows, buffaloes, goats, sheep, and country animals.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#065f46',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '192x192',
        type: 'image/x-icon',
        purpose: 'any',
      },
      {
        src: '/favicon.ico',
        sizes: '512x512',
        type: 'image/x-icon',
        purpose: 'any',
      },
    ],
  };
}
