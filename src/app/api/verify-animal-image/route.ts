import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { photoDataUri, expectedCategory } = body as {
      photoDataUri?: string;
      expectedCategory?: string;
    };

    if (!photoDataUri || !photoDataUri.startsWith('data:image/')) {
      return NextResponse.json(
        {
          containsAnimal: false,
          matchesCategory: false,
          detectedAnimal: 'None',
          reasonTe: 'చెల్లుబాటు అయ్యే ఫోటో ఫైల్ కాదు. దయచేసి స్పష్టమైన పశువు ఫోటోను ఎంచుకోండి.',
          reasonEn: 'Invalid image format. Please select a valid animal photo.',
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        fallbackToClientModel: true,
        reason: 'GEMINI_API_KEY not configured on server',
      });
    }

    const matches = photoDataUri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json(
        {
          containsAnimal: false,
          matchesCategory: false,
          detectedAnimal: 'None',
          reasonTe: 'ఫోటో డేటా చదవడంలో లోపం జరిగింది.',
          reasonEn: 'Failed to parse image data URI.',
        },
        { status: 400 }
      );
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const categoryInstruction = expectedCategory
      ? `The user selected the category "${expectedCategory}". Check if the animal in the photo reasonably belongs to "${expectedCategory}" (note: Cow/Ox/Buffalo are bovines; Goat/Sheep are caprines/ovines; Hen/Rooster/Chicken are poultry; Pigeon/Dove are birds).`
      : 'Identify what kind of animal is present.';

    const promptText = `You are a strict livestock and animal marketplace photo verifier.
Analyze this image carefully and determine:
1. Does this image clearly show a real, living animal (such as a Cow, Buffalo, Ox, Bull, Goat, Sheep, Hen, Rooster, Dog, Cat, Pig, Pigeon, Bird, Horse, etc.) as the main subject?
2. Reject the image (containsAnimal = false) if:
   - There is NO animal in the image (e.g., human selfie, group of people, car, bike, house, landscape, food, furniture, screenshot, text document, ID card, poster, cartoon, plush toy, statue, or blurry/blank image).
   - A human is the primary subject of the photo rather than an animal.
3. ${categoryInstruction}

Return a JSON object following the exact schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            containsAnimal: {
              type: Type.BOOLEAN,
              description: 'True ONLY if a real animal is clearly visible as the main subject of the photo.',
            },
            detectedAnimal: {
              type: Type.STRING,
              description: 'Name of the animal or object detected in the photo (e.g., Cow, Buffalo, Goat, Person, Car, Document).',
            },
            matchesCategory: {
              type: Type.BOOLEAN,
              description: 'True if the detected animal matches or is closely related to the expectedCategory.',
            },
            reasonTe: {
              type: Type.STRING,
              description: 'Clear explanation in Telugu language for why the image was accepted or rejected.',
            },
            reasonEn: {
              type: Type.STRING,
              description: 'Clear explanation in English for why the image was accepted or rejected.',
            },
          },
          required: ['containsAnimal', 'detectedAnimal', 'matchesCategory', 'reasonTe', 'reasonEn'],
        },
      },
    });

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      return NextResponse.json({ fallbackToClientModel: true });
    }

    const parsed = JSON.parse(rawText);
    return NextResponse.json({
      ...parsed,
      fallbackToClientModel: false,
    });
  } catch (error) {
    console.error('Gemini animal verification route error:', error);
    // Signal client to run its local TensorFlow.js neural vision verifier
    return NextResponse.json({
      fallbackToClientModel: true,
      errorMessage: error instanceof Error ? error.message : 'Verification API unavailable',
    });
  }
}
