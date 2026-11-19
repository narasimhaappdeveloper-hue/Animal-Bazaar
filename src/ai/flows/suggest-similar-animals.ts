'use server';

import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

export interface SuggestSimilarAnimalsInput {
  category: string;
  breed: string;
  location: string;
  title: string;
  desc: string;
}

export interface SimilarAnimalSuggestion {
  title: string;
  breed: string;
  location: string;
  reason: string;
}

export type SuggestSimilarAnimalsOutput = SimilarAnimalSuggestion[];

export async function suggestSimilarAnimals(
  input: SuggestSimilarAnimalsInput
): Promise<SuggestSimilarAnimalsOutput> {
  const fallback: SuggestSimilarAnimalsOutput = [
    {
      title: `Pure ${input.breed} ${input.category}`,
      breed: input.breed,
      location: input.location,
      reason: 'అదే జాతి మరియు సమీప ప్రాంతం (Similar breed and regional match)',
    },
  ];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallback;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `You are an expert livestock marketplace advisor. Based on this listing, suggest 3 similar animal listings buyers in the same region might consider.

Category: ${input.category}
Breed: ${input.breed}
Location: ${input.location}
Title: ${input.title}
Description: ${input.desc}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Title of the similar animal listing.' },
              breed: { type: Type.STRING, description: 'Breed of the similar animal.' },
              location: { type: Type.STRING, description: 'Region or district in India.' },
              reason: { type: Type.STRING, description: 'Brief reason why this is a great similar option.' },
            },
            required: ['title', 'breed', 'location', 'reason'],
          },
        },
      },
    });

    const text = (response.text ?? '').trim();
    if (!text) return fallback;
    const parsed = JSON.parse(text) as SuggestSimilarAnimalsOutput;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch (error) {
    console.error('Suggest similar animals error:', error);
    return fallback;
  }
}
