'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting similar animal listings based on a given animal listing.
 *
 * It exports:
 * - `suggestSimilarAnimals`: An async function that takes an animal listing as input and returns a list of similar animal listings.
 * - `SuggestSimilarAnimalsInput`: The TypeScript type definition for the input to the `suggestSimilarAnimals` function.
 * - `SuggestSimilarAnimalsOutput`: The TypeScript type definition for the output of the `suggestSimilarAnimals` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSimilarAnimalsInputSchema = z.object({
  category: z.string().describe('The category of the animal (e.g., Cow, Buffalo, Dog).'),
  breed: z.string().describe('The breed of the animal (e.g., HF, Murrah, German Shepherd).'),
  location: z.string().describe('The location where the animal is listed for sale.'),
  title: z.string().describe('The title of the animal listing.'),
  desc: z.string().describe('The description of the animal listing.'),
});
export type SuggestSimilarAnimalsInput = z.infer<typeof SuggestSimilarAnimalsInputSchema>;

const SuggestSimilarAnimalsOutputSchema = z.array(
  z.object({
    title: z.string().describe('The title of the similar animal listing.'),
    breed: z.string().describe('The breed of the similar animal.'),
    location: z.string().describe('The location of the similar animal listing.'),
    reason: z.string().describe('The reason why this animal is suggested as similar.'),
  })
).describe('A list of similar animal listings.');

export type SuggestSimilarAnimalsOutput = z.infer<typeof SuggestSimilarAnimalsOutputSchema>;

export async function suggestSimilarAnimals(input: SuggestSimilarAnimalsInput): Promise<SuggestSimilarAnimalsOutput> {
  return suggestSimilarAnimalsFlow(input);
}

const suggestSimilarAnimalsPrompt = ai.definePrompt({
  name: 'suggestSimilarAnimalsPrompt',
  input: {schema: SuggestSimilarAnimalsInputSchema},
  output: {schema: SuggestSimilarAnimalsOutputSchema},
  prompt: `You are an AI assistant that suggests similar animal listings based on a given animal listing.

  Given the following animal listing:

  Category: {{{category}}}
  Breed: {{{breed}}}
  Location: {{{location}}}
  Title: {{{title}}}
  Description: {{{desc}}}

  Suggest a list of similar animal listings. For each suggested listing, include the title, breed, location, and a brief reason why it is similar to the given listing.

  Format your response as a JSON array of objects, where each object represents a similar animal listing and includes the following fields:
  - title: The title of the similar animal listing.
  - breed: The breed of the similar animal.
  - location: The location of the similar animal listing.
  - reason: A brief explanation of why this animal is similar to the given listing.
  `,
});

const suggestSimilarAnimalsFlow = ai.defineFlow(
  {
    name: 'suggestSimilarAnimalsFlow',
    inputSchema: SuggestSimilarAnimalsInputSchema,
    outputSchema: SuggestSimilarAnimalsOutputSchema,
  },
  async input => {
    try {
      const {output} = await suggestSimilarAnimalsPrompt(input);
      return output!;
    } catch (error) {
      console.error('Error in suggestSimilarAnimals flow:', error);
      throw error;
    }
  }
);
