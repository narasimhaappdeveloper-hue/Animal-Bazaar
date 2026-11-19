'use server';

/**
 * @fileOverview Summarizes animal listings using AI to generate concise descriptions.
 *
 * - summarizeAnimalListing - Generates a summary of an animal listing.
 * - SummarizeAnimalListingInput - The input type for the summarizeAnimalListing function.
 * - SummarizeAnimalListingOutput - The return type for the summarizeAnimalListing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAnimalListingInputSchema = z.object({
  title: z.string().describe('The title of the animal listing.'),
  breed: z.string().describe('The breed of the animal.'),
  price: z.number().describe('The price of the animal.'),
  location: z.string().describe('The location of the animal.'),
  desc: z.string().describe('The detailed description of the animal.'),
});
export type SummarizeAnimalListingInput = z.infer<typeof SummarizeAnimalListingInputSchema>;

const SummarizeAnimalListingOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the animal listing.'),
  suggestedItems: z.array(z.string()).describe('A list of suggested similar items.'),
});
export type SummarizeAnimalListingOutput = z.infer<typeof SummarizeAnimalListingOutputSchema>;

export async function summarizeAnimalListing(
  input: SummarizeAnimalListingInput
): Promise<SummarizeAnimalListingOutput> {
  try {
    const result = await summarizeAnimalListingFlow(input);
    return result;
  } catch (error) {
    console.error('Summarize animal listing error:', error);
    return {
      summary: `పశువు వివరాలు: ${input.title} (${input.breed}) ${input.location} లో ₹${input.price.toLocaleString('en-IN')} ధరతో అమ్మకానికి ఉంది. వివరణ: ${input.desc}`,
      suggestedItems: [`${input.breed} పశువులు`, `సమీప ప్రాంత పశువుల సంత`],
    };
  }
}

const summarizeAnimalListingPrompt = ai.definePrompt({
  name: 'summarizeAnimalListingPrompt',
  input: {schema: SummarizeAnimalListingInputSchema},
  output: {schema: SummarizeAnimalListingOutputSchema},
  prompt: `You are an expert animal listing summarizer. You will receive details about an animal listing and you will create a concise and engaging summary of the animal listing.

Listing Title: {{title}}
Breed: {{breed}}
Price: {{price}}
Location: {{location}}
Description: {{desc}}

Summary:`,
});

const summarizeAnimalListingFlow = ai.defineFlow(
  {
    name: 'summarizeAnimalListingFlow',
    inputSchema: SummarizeAnimalListingInputSchema,
    outputSchema: SummarizeAnimalListingOutputSchema,
  },
  async input => {
    try {
      const {output} = await summarizeAnimalListingPrompt(input);
      return output || {
        summary: `${input.title} (${input.breed}) in ${input.location} for ₹${input.price}.`,
        suggestedItems: [],
      };
    } catch (err) {
      console.error('summarizeAnimalListingFlow execution error:', err);
      return {
        summary: `${input.title} (${input.breed}) in ${input.location} for ₹${input.price}. ${input.desc}`,
        suggestedItems: [],
      };
    }
  }
);
