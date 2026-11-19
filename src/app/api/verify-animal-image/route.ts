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
      return NextResponse.json(
        {
          containsAnimal: false,
          matchesCategory: false,
          detectedAnimal: 'Unverified',
          reasonTe: 'AI ఫోటో ధ్రువీకరణ సేవ అందుబాటులో లేదు (API Key లేదు). దయచేసి Settings > Secrets లో API Key తనిఖీ చేయండి.',
          reasonEn: 'AI photo verification is unavailable because the API key is not configured.',
        },
        { status: 503 }
      );
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
      ? `The user selected the category "${expectedCategory}". Set matchesCategory = true ONLY if the animal clearly matches or belongs to "${expectedCategory}" (note: Cow/Ox/Buffalo are closely related bovines—still distinguish Cow vs Buffalo vs Ox accurately when clear; Goat/Sheep are caprines/ovines; Hen/Rooster/Chicken are poultry; Pigeon/Dove are birds).`
      : 'Identify what kind of animal is present and set matchesCategory = true if it is a real animal.';

    const promptText = `You are a strict livestock and animal marketplace photo verifier.
Analyze this image carefully and determine:
1. Does this image clearly show a real, living animal (such as a Cow, Buffalo, Ox, Bull, Goat, Sheep, Hen, Rooster, Dog, Cat, Pig, Pigeon, Bird, Horse, etc.) as the main subject?
2. Strictly REJECT the image (containsAnimal = false, matchesCategory = false) if:
   - There is NO living animal in the image (e.g., human selfie, portrait, group of people, car, bike, tractor, building, house, landscape, food, furniture, phone screenshot, text document, ID card, poster, cartoon, drawing, plush toy, statue, or blank/blurry image).
   - A human is the main subject of the photo rather than an animal.
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
              description: 'True ONLY if a real living animal is clearly visible as the main subject of the photo.',
            },
            detectedAnimal: {
              type: Type.STRING,
              description: 'Name of the animal or object detected in the photo (e.g., Cow, Buffalo, Goat, Person, Car, Document).',
            },
            matchesCategory: {
              type: Type.BOOLEAN,
              description: 'True ONLY if containsAnimal is true AND the detected animal matches the expectedCategory.',
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
      return NextResponse.json(
        {
          containsAnimal: false,
          matchesCategory: false,
          detectedAnimal: 'Unverified',
          reasonTe: 'ఫోటోను AI విశ్లేషించలేకపోయింది. దయచేసి స్పష్టమైన పశువు ఫోటోను మళ్ళీ అప్‌లోడ్ చేయండి.',
          reasonEn: 'AI could not analyze this photo. Please try again with a clear animal photo.',
        },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(rawText);
    const containsAnimal = Boolean(parsed.containsAnimal);
    const matchesCategory = containsAnimal && Boolean(parsed.matchesCategory);

    return NextResponse.json({
      containsAnimal,
      matchesCategory,
      detectedAnimal: parsed.detectedAnimal || (containsAnimal ? expectedCategory || 'Animal' : 'Non-Animal'),
      reasonTe: parsed.reasonTe || '',
      reasonEn: parsed.reasonEn || '',
    });
  } catch (error) {
    console.error('Gemini animal verification route error:', error);
    const errMsg = error instanceof Error ? error.message : 'Verification API error';
    const isAuthError = errMsg.includes('403') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('PERMISSION_DENIED');

    return NextResponse.json(
      {
        containsAnimal: false,
        matchesCategory: false,
        detectedAnimal: 'Verification Failed',
        reasonTe: isAuthError
          ? 'API కీ సమస్య వల్ల ఫోటో ధ్రువీకరణ జరగలేదు. దయచేసి Settings > Secrets లో API కీ తనిఖీ చేయండి.'
          : 'ఫోటోలో పశువును ధ్రువీకరించడం విఫలమైంది. దయచేసి స్పష్టమైన పశువు ఫోటోతో మళ్ళీ ప్రయత్నించండి.',
        reasonEn: isAuthError
          ? 'Photo verification failed due to an API key issue. Please verify your API key in Settings > Secrets.'
          : 'Failed to verify an animal in this photo. Please try again with a clear photo of an animal.',
      },
      { status: isAuthError ? 403 : 500 }
    );
  }
}
