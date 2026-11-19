'use client';

import { locations, type State } from './definitions';

export interface PostalOfficeItem {
  Name: string;
  Block: string;
  District: string;
  State: string;
  Pincode: string;
}

export interface PinCodeVerificationResult {
  isValid: boolean;
  pincode: string;
  state: State | '';
  district: string;
  postOffices: PostalOfficeItem[];
  errorTe?: string;
  errorEn?: string;
}

function matchBestDistrict(state: State, apiDistrict: string): string {
  const stateDistricts = locations[state] || [];
  if (stateDistricts.length === 0) return apiDistrict;

  const cleanApi = apiDistrict.toLowerCase().trim();
  const exact = stateDistricts.find((d) => d.toLowerCase() === cleanApi);
  if (exact) return exact;

  const partial = stateDistricts.find(
    (d) =>
      d.toLowerCase().includes(cleanApi) ||
      cleanApi.includes(d.toLowerCase())
  );
  if (partial) return partial;

  return stateDistricts[0];
}

function matchBestState(apiState: string): State | '' {
  const stateKeys = Object.keys(locations) as State[];
  const cleanApi = apiState.toLowerCase().trim();
  const exact = stateKeys.find((s) => s.toLowerCase() === cleanApi);
  if (exact) return exact;

  const partial = stateKeys.find(
    (s) => s.toLowerCase().includes(cleanApi) || cleanApi.includes(s.toLowerCase())
  );
  return partial || '';
}

export async function verifyIndianPinCode(pincode: string): Promise<PinCodeVerificationResult> {
  const cleanPin = pincode.replace(/\D/g, '').trim();

  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return {
      isValid: false,
      pincode: cleanPin,
      state: '',
      district: '',
      postOffices: [],
      errorTe: 'చెల్లుబాటు అయ్యే 6 అంకెల పిన్ కోడ్ నమోదు చేయండి (ఉదా: 500001, 522001).',
      errorEn: 'Please enter a valid 6-digit Indian Pin Code (e.g., 500001, 522001).',
    };
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
    if (!res.ok) {
      throw new Error(`Postal API returned ${res.status}`);
    }

    const data = await res.json();
    const record = Array.isArray(data) ? data[0] : null;

    if (!record || record.Status !== 'Success' || !Array.isArray(record.PostOffice) || record.PostOffice.length === 0) {
      return {
        isValid: false,
        pincode: cleanPin,
        state: '',
        district: '',
        postOffices: [],
        errorTe: `పిన్ కోడ్ '${cleanPin}' ఉనికిలో లేదు. నకిలీ పిన్ కోడ్ లేదా చిరునామా అనుమతించబడదు.`,
        errorEn: `Pin Code '${cleanPin}' does not exist in India Post records. Fake addresses are not allowed.`,
      };
    }

    const offices: PostalOfficeItem[] = record.PostOffice.map((po: any) => ({
      Name: po.Name,
      Block: po.Block || po.Taluk || '',
      District: po.District,
      State: po.State,
      Pincode: po.Pincode || cleanPin,
    }));

    const first = offices[0];
    const matchedState = matchBestState(first.State);
    const matchedDistrict = matchedState
      ? matchBestDistrict(matchedState, first.District)
      : first.District;

    return {
      isValid: true,
      pincode: cleanPin,
      state: matchedState,
      district: matchedDistrict,
      postOffices: offices,
    };
  } catch (err) {
    console.error('Error verifying Pin Code:', err);
    return {
      isValid: false,
      pincode: cleanPin,
      state: '',
      district: '',
      postOffices: [],
      errorTe: 'పిన్ కోడ్ ధ్రువీకరించడంలో నెట్‌వర్క్ సమస్య ఎదురైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.',
      errorEn: 'Could not verify Pin Code due to network error. Please try again.',
    };
  }
}

export interface GpsAddressResult {
  success: boolean;
  pincode?: string;
  village?: string;
  district?: string;
  state?: State | '';
  lat?: number;
  lng?: number;
  postOffices?: PostalOfficeItem[];
  errorTe?: string;
  errorEn?: string;
}

export async function detectVerifiedGpsLocation(): Promise<GpsAddressResult> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return {
      success: false,
      errorTe: 'మీ పరికరంలో GPS లొకేషన్ అందుబాటులో లేదు.',
      errorEn: 'GPS Geolocation is not supported on this device.',
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
              },
            }
          );
          if (!res.ok) {
            throw new Error('Reverse geocoding failed');
          }
          const geo = await res.json();
          const addr = geo.address || {};
          const rawPin = (addr.postcode || '').replace(/\D/g, '');
          const detectedLocality =
            addr.village ||
            addr.suburb ||
            addr.town ||
            addr.city_district ||
            addr.city ||
            addr.county ||
            '';

          if (rawPin && /^[1-9][0-9]{5}$/.test(rawPin)) {
            const pinCheck = await verifyIndianPinCode(rawPin);
            if (pinCheck.isValid) {
              return resolve({
                success: true,
                pincode: rawPin,
                village: pinCheck.postOffices[0]?.Name || detectedLocality,
                district: pinCheck.district,
                state: pinCheck.state,
                postOffices: pinCheck.postOffices,
                lat: latitude,
                lng: longitude,
              });
            }
          }

          const matchedState = matchBestState(addr.state || 'Telangana');
          const matchedDistrict = matchedState
            ? matchBestDistrict(matchedState, addr.state_district || addr.county || addr.city || 'Hyderabad')
            : 'Hyderabad';

          resolve({
            success: true,
            pincode: rawPin || '',
            village: detectedLocality || matchedDistrict,
            district: matchedDistrict,
            state: matchedState || 'Telangana',
            lat: latitude,
            lng: longitude,
          });
        } catch (err) {
          console.error('GPS reverse geocoding error:', err);
          resolve({
            success: false,
            errorTe: 'GPS నుండి చిరునామా పొందడం విఫలమైంది. దయచేసి మీ 6 అంకెల పిన్ కోడ్ నమోదు చేయండి.',
            errorEn: 'Could not resolve GPS address. Please enter your 6-digit Pin Code.',
          });
        }
      },
      (geoErr) => {
        console.error('Geolocation permission error:', geoErr);
        resolve({
          success: false,
          errorTe: 'లొకేషన్ అనుమతి నిరాకరించబడింది. దయచేసి లొకేషన్ అనుమతి ఇవ్వండి లేదా సరైన పిన్ కోడ్ నమోదు చేయండి.',
          errorEn: 'Location permission denied. Please allow GPS access or enter a valid 6-digit Pin Code.',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  });
}
