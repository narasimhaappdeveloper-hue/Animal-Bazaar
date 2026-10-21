import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-animal-listing.ts';
import '@/ai/flows/suggest-similar-animals.ts';
import '@/ai/flows/validate-animal-image.ts';
