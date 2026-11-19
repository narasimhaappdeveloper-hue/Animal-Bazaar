'use server';

import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

export interface SummarizeAnimalListingInput {
  title: string;
  breed: string;
  price: number;
  location: string;
  desc: string;
}

export interface SummarizeAnimalListingOutput {
  summary: string;
  suggestedItems: string[];
}

export async function summarizeAnimalListing(
  input: SummarizeAnimalListingInput
): Promise<SummarizeAnimalListingOutput> {
  const fallback: SummarizeAnimalListingOutput = {
    summary: `పశువు వివరాలు: ${input.title} (${input.breed}) ${input.location} లో ₹${input.price.toLocaleString('en-IN')} ధరతో అమ్మకానికి ఉంది. వివరణ: ${input.desc}`,
    suggestedItems: [`${input.breed} పశువులు`, `${input.location} ప్రాంత పశువుల సంత`],
  };

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
      contents: `You are an expert livestock marketplace summarizer. Create a concise, helpful summary of this animal listing and suggest 2-3 related livestock items or breeds buyers might also look for.

Listing Title: ${input.title}
Breed: ${input.breed}
Price: ₹${input.price}
Location: ${input.location}
Description: ${input.desc}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'A concise, engaging summary of the animal listing.',
            },
            suggestedItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 related livestock suggestions.',
            },
          },
          required: ['summary', 'suggestedItems'],
        },
      },
    });

    const text = (response.text ?? '').trim();
    if (!text) return fallback;
    const parsed = JSON.parse(text) as SummarizeAnimalListingOutput;
    return {
      summary: parsed.summary || fallback.summary,
      suggestedItems: Array.isArray(parsed.suggestedItems) ? parsed.suggestedItems : [],
    };
  } catch (error) {
    console.error('Summarize animal listing error:', error);
    return fallback;
  }
}
