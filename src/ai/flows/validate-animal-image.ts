'use server';
/**
 * @fileOverview A Genkit flow to validate if an image contains an animal and does not feature humans.
 *
 * - validateAnimalImage - A function that analyzes an image and determines if it contains an animal as the main subject.
 * - ValidateAnimalImageInput - The input type for the validateAnimalImage function.
 * - ValidateAnimalImageOutput - The return type for the validateAnimalImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateAnimalImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ValidateAnimalImageInput = z.infer<typeof ValidateAnimalImageInputSchema>;

const ValidateAnimalImageOutputSchema = z.object({
  containsAnimal: z.boolean().describe('Whether or not the image contains an animal and is valid.'),
  reason: z.string().describe('A brief explanation for the decision.'),
});
export type ValidateAnimalImageOutput = z.infer<typeof ValidateAnimalImageOutputSchema>;

export async function validateAnimalImage(input: ValidateAnimalImageInput): Promise<ValidateAnimalImageOutput> {
  return validateAnimalImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateAnimalImagePrompt',
  input: {schema: ValidateAnimalImageInputSchema},
  output: {schema: ValidateAnimalImageOutputSchema},
  prompt: `You are an image analysis expert for an animal marketplace. Your task is to determine if the provided image is suitable for a listing.

Your rules are:
1. The image MUST contain an animal (mammal, bird, fish, reptile, insect, etc.). The animal should be the main subject.
2. The image MUST NOT feature any humans. If a person is clearly visible, the image is invalid.
3. If the image meets both rules, set containsAnimal to true.
4. If the image fails either rule, set containsAnimal to false and provide a clear reason. For example, "No animal detected in the image" or "Images with people are not allowed."

Analyze the following photo and provide your decision.

Photo: {{media url=photoDataUri}}`,
});

const validateAnimalImageFlow = ai.defineFlow(
  {
    name: 'validateAnimalImageFlow',
    inputSchema: ValidateAnimalImageInputSchema,
    outputSchema: ValidateAnimalImageOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (error) {
      console.error('Error in validateAnimalImage flow:', error);
      throw error;
    }
  }
);
