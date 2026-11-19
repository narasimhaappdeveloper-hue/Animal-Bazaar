'use server';

import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

export interface ValidateAnimalImageInput {
  photoDataUri: string;
}

export interface ValidateAnimalImageOutput {
  containsAnimal: boolean;
  reason: string;
}

export async function validateAnimalImage(
  input: ValidateAnimalImageInput
): Promise<ValidateAnimalImageOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      containsAnimal: false,
      reason: 'Image verification service is unavailable.',
    };
  }

  const matches = input.photoDataUri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return {
      containsAnimal: false,
      reason: 'Invalid image format.',
    };
  }

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
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          },
          {
            text: 'Determine if this image clearly shows a real living animal as the main subject (and NOT humans, vehicles, documents, or non-animal objects). Return JSON with containsAnimal (boolean) and reason (string).',
          },
        ],
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            containsAnimal: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
          },
          required: ['containsAnimal', 'reason'],
        },
      },
    });

    const text = (response.text ?? '').trim();
    if (!text) {
      return { containsAnimal: false, reason: 'Could not verify an animal in the photo.' };
    }
    const parsed = JSON.parse(text) as ValidateAnimalImageOutput;
    return {
      containsAnimal: Boolean(parsed.containsAnimal),
      reason: parsed.reason || 'Image verification completed.',
    };
  } catch (error) {
    console.error('Image validation error:', error);
    return {
      containsAnimal: false,
      reason: 'Could not verify that an animal is present in this image. Please try again with a clear animal photo.',
    };
  }
}
