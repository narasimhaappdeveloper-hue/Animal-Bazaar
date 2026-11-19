'use client';

import type { AnimalCategory } from './definitions';

export interface AnimalVerificationOutcome {
  containsAnimal: boolean;
  matchesCategory: boolean;
  detectedAnimal: string;
  reasonTe: string;
  reasonEn: string;
}

const categoryTeluguNames: Record<string, string> = {
  Cow: 'ఆవు (Cow)',
  Buffalo: 'గేదె (Buffalo)',
  Ox: 'ఎద్దు (Ox)',
  Goat: 'మేక (Goat)',
  Sheep: 'గొర్రె (Sheep)',
  Hen: 'కోడి (Hen)',
  Dog: 'కుక్క (Dog)',
  Cat: 'పిల్లి (Cat)',
  Pig: 'పంది (Pig)',
  Pigeon: 'పావురం (Pigeon)',
};

/**
 * Downscales large phone camera photos to max 1024px JPEG so server verification
 * is fast and never exceeds request payload limits, while rejecting tiny/blank images early.
 */
async function prepareImageForVerification(
  photoDataUri: string
): Promise<{ ok: true; compressedUri: string } | { ok: false; outcome: AnimalVerificationOutcome }> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = (e) => reject(e);
      el.src = photoDataUri;
    });

    if (img.width < 80 || img.height < 80) {
      return {
        ok: false,
        outcome: {
          containsAnimal: false,
          matchesCategory: false,
          detectedAnimal: 'Low Resolution',
          reasonTe: 'ఫోటో పరిమాణం చాలా చిన్నదిగా ఉంది. దయచేసి స్పష్టమైన పశువు ఫోటోను అప్‌లోడ్ చేయండి.',
          reasonEn: 'Image resolution is too small. Please upload a clear photo of the animal.',
        },
      };
    }

    const maxDim = 1024;
    let targetW = img.width;
    let targetH = img.height;
    if (targetW > maxDim || targetH > maxDim) {
      const scale = Math.min(maxDim / targetW, maxDim / targetH);
      targetW = Math.round(targetW * scale);
      targetH = Math.round(targetH * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { ok: true, compressedUri: photoDataUri };
    }

    ctx.drawImage(img, 0, 0, targetW, targetH);

    // Quick blank/solid-color rejection before calling API
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 32;
    sampleCanvas.height = 32;
    const sampleCtx = sampleCanvas.getContext('2d');
    if (sampleCtx) {
      sampleCtx.drawImage(img, 0, 0, 32, 32);
      const data = sampleCtx.getImageData(0, 0, 32, 32).data;
      let diffSum = 0;
      const r0 = data[0];
      const g0 = data[1];
      const b0 = data[2];
      for (let i = 0; i < data.length; i += 4) {
        diffSum += Math.abs(data[i] - r0) + Math.abs(data[i + 1] - g0) + Math.abs(data[i + 2] - b0);
      }
      if (diffSum < 600) {
        return {
          ok: false,
          outcome: {
            containsAnimal: false,
            matchesCategory: false,
            detectedAnimal: 'Blank / Solid Image',
            reasonTe: 'ఖాళీ లేదా ఒకే రంగు ఉన్న చిత్రం తిరస్కరించబడింది. దయచేసి నిజమైన పశువు ఫోటో అప్‌లోడ్ చేయండి.',
            reasonEn: 'Blank or solid-color image rejected. Please upload a real photo of an animal.',
          },
        };
      }
    }

    const compressedUri = canvas.toDataURL('image/jpeg', 0.82);
    return { ok: true, compressedUri };
  } catch (err) {
    console.error('Image preprocessing error:', err);
    return {
      ok: false,
      outcome: {
        containsAnimal: false,
        matchesCategory: false,
        detectedAnimal: 'Invalid File',
        reasonTe: 'ఫోటో చదవడంలో లోపం జరిగింది. దయచేసి సరైన పశువు ఫోటో ఫైల్ ఎంచుకోండి.',
        reasonEn: 'Could not read this image file. Please select a valid animal photo.',
      },
    };
  }
}

export async function verifyAnimalPhotoStrict(
  photoDataUri: string,
  selectedCategory?: AnimalCategory | ''
): Promise<AnimalVerificationOutcome> {
  // 1. Validate & downscale image locally before sending to AI verification
  const prepared = await prepareImageForVerification(photoDataUri);
  if (!prepared.ok) {
    return prepared.outcome;
  }

  // 2. Strict server-side Gemini Vision verification (NEVER auto-approves on failure)
  try {
    const res = await fetch('/api/verify-animal-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoDataUri: prepared.compressedUri,
        expectedCategory: selectedCategory || undefined,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || typeof data.containsAnimal !== 'boolean') {
      return {
        containsAnimal: false,
        matchesCategory: false,
        detectedAnimal: data?.detectedAnimal || 'Unverified',
        reasonTe:
          data?.reasonTe ||
          'ఫోటోలో పశువు ఉందో లేదో ధ్రువీకరించడం సాధ్యం కాలేదు. దయచేసి స్పష్టమైన పశువు ఫోటోతో మళ్ళీ ప్రయత్నించండి.',
        reasonEn:
          data?.reasonEn ||
          'Could not verify whether this photo contains an animal. Please try again with a clear animal photo.',
      };
    }

    if (!data.containsAnimal) {
      return {
        containsAnimal: false,
        matchesCategory: false,
        detectedAnimal: data.detectedAnimal || 'Non-Animal',
        reasonTe:
          data.reasonTe ||
          `ఈ ఫోటోలో పశువు కనిపించలేదు (${data.detectedAnimal || 'ఇతర చిత్రం'} గుర్తించబడింది). దయచేసి పశువు ఉన్న ఫోటో మాత్రమే అప్‌లోడ్ చేయండి.`,
        reasonEn:
          data.reasonEn ||
          `No animal detected in this photo (detected: ${data.detectedAnimal || 'non-animal object'}). Only real animal photos are allowed.`,
      };
    }

    if (selectedCategory && data.matchesCategory === false) {
      const catTe = categoryTeluguNames[selectedCategory] || selectedCategory;
      return {
        containsAnimal: false,
        matchesCategory: false,
        detectedAnimal: data.detectedAnimal || 'Other Animal',
        reasonTe:
          data.reasonTe ||
          `మీరు ఎంచుకున్న వర్గం '${catTe}', కానీ ఫోటోలో '${data.detectedAnimal}' కనిపిస్తోంది. దయచేసి సరైన ${catTe} ఫోటోను అప్‌లోడ్ చేయండి.`,
        reasonEn:
          data.reasonEn ||
          `You selected '${selectedCategory}', but the photo shows '${data.detectedAnimal}'. Please upload a matching ${selectedCategory} photo.`,
      };
    }

    return {
      containsAnimal: true,
      matchesCategory: true,
      detectedAnimal: data.detectedAnimal || selectedCategory || 'Animal',
      reasonTe:
        data.reasonTe ||
        `ధ్రువీకరించబడింది: ఫోటోలో ${data.detectedAnimal || 'పశువు'} స్పష్టంగా గుర్తించబడింది ✓`,
      reasonEn:
        data.reasonEn ||
        `Verified: ${data.detectedAnimal || 'Animal'} clearly detected in the photo ✓`,
    };
  } catch (err) {
    console.error('Animal verification network error:', err);
    return {
      containsAnimal: false,
      matchesCategory: false,
      detectedAnimal: 'Network Error',
      reasonTe:
        'నెట్‌వర్క్ లోపం వల్ల ఫోటో ధ్రువీకరణ పూర్తి కాలేదు. పశువు ఫోటో ధ్రువీకరించబడిన తర్వాత మాత్రమే అప్‌లోడ్ అవుతుంది.',
      reasonEn:
        'Network error while verifying photo. A photo can only be uploaded after animal verification succeeds.',
    };
  }
}
