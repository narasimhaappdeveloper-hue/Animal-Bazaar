'use client';

import { locations, type State } from './definitions';

export interface PostalOfficeItem {
  Name: string;
  Block: string;
  Division?: string;
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

// Common aliases / old spellings used by India Post or OSM Nominatim
const DISTRICT_ALIASES: Record<string, string> = {
  // Andhra Pradesh
  cuddapah: 'YSR Kadapa',
  kadapa: 'YSR Kadapa',
  ysr: 'YSR Kadapa',
  ysrdistrict: 'YSR Kadapa',
  ysrkadapa: 'YSR Kadapa',
  ananthapur: 'Anantapur',
  ananthapuramu: 'Anantapur',
  anantapuramu: 'Anantapur',
  nellore: 'Sri Potti Sriramulu Nellore',
  spsrnellore: 'Sri Potti Sriramulu Nellore',
  sripottisriramulunellore: 'Sri Potti Sriramulu Nellore',
  konaseema: 'Dr. B.R. Ambedkar Konaseema',
  ambedkarkonaseema: 'Dr. B.R. Ambedkar Konaseema',
  drbrambedkarkonaseema: 'Dr. B.R. Ambedkar Konaseema',
  ntr: 'NTR',
  ntrdistrict: 'NTR',
  sathyasai: 'Sri Sathya Sai',
  srisathyasai: 'Sri Sathya Sai',
  alluri: 'Alluri Sitharama Raju',
  allurisitharamaraju: 'Alluri Sitharama Raju',
  allurisitaramaraju: 'Alluri Sitharama Raju',
  parvathipuram: 'Parvathipuram Manyam',
  parvathipurammanyam: 'Parvathipuram Manyam',
  visakhapatanam: 'Visakhapatnam',
  vizag: 'Visakhapatnam',
  anakapalle: 'Anakapalli',
  // Telangana
  rangareddy: 'Rangareddy',
  kvrangareddy: 'Rangareddy',
  rangareddi: 'Rangareddy',
  kvrangareddi: 'Rangareddy',
  hanumakonda: 'Hanamkonda',
  hanamkonda: 'Hanamkonda',
  warangalurban: 'Hanamkonda',
  warangalrural: 'Warangal',
  medchal: 'Medchal-Malkajgiri',
  malkajgiri: 'Medchal-Malkajgiri',
  medchalmalkajgiri: 'Medchal-Malkajgiri',
  yadadri: 'Yadadri Bhuvanagiri',
  bhuvanagiri: 'Yadadri Bhuvanagiri',
  bhongir: 'Yadadri Bhuvanagiri',
  yadadribhuvanagiri: 'Yadadri Bhuvanagiri',
  yadadribhongir: 'Yadadri Bhuvanagiri',
  komarambheem: 'Komaram Bheem Asifabad',
  kumurambheem: 'Komaram Bheem Asifabad',
  kumurambheemasifabad: 'Komaram Bheem Asifabad',
  komarambheemasifabad: 'Komaram Bheem Asifabad',
  asifabad: 'Komaram Bheem Asifabad',
  jayashankar: 'Jayashankar Bhupalpally',
  bhupalpally: 'Jayashankar Bhupalpally',
  bhupalpalle: 'Jayashankar Bhupalpally',
  jayashankarbhupalpally: 'Jayashankar Bhupalpally',
  jayashankarbhupalpalle: 'Jayashankar Bhupalpally',
  jogulamba: 'Jogulamba Gadwal',
  gadwal: 'Jogulamba Gadwal',
  jogulambagadwal: 'Jogulamba Gadwal',
  bhadradri: 'Bhadradri Kothagudem',
  kothagudem: 'Bhadradri Kothagudem',
  bhadradrikothagudem: 'Bhadradri Kothagudem',
  rajanna: 'Rajanna Sircilla',
  sircilla: 'Rajanna Sircilla',
  siricilla: 'Rajanna Sircilla',
  rajannasircilla: 'Rajanna Sircilla',
  mahbubnagar: 'Mahabubnagar',
  mahabubnagar: 'Mahabubnagar',
  mahbubabad: 'Mahabubabad',
  mahabubabad: 'Mahabubabad',
  jagityal: 'Jagtial',
  jagtial: 'Jagtial',
  jangoan: 'Jangaon',
  jangaon: 'Jangaon',
  siddipeta: 'Siddipet',
  peddapalle: 'Peddapalli',
  mancheriyal: 'Mancherial',
  wanaparthi: 'Wanaparthy',
  // Other Indian cities/districts with spelling differences
  bangalore: 'Bengaluru Urban',
  bengaluru: 'Bengaluru Urban',
  bangaloreurban: 'Bengaluru Urban',
  bangalorerural: 'Bengaluru Rural',
  belgaum: 'Belagavi',
  bellary: 'Ballari',
  gulbarga: 'Kalaburagi',
  mysore: 'Mysuru',
  shimoga: 'Shivamogga',
  tumkur: 'Tumakuru',
  allahabad: 'Prayagraj (Allahabad)',
  faizabad: 'Ayodhya (Faizabad)',
  gurgaon: 'Gurugram (Gurgaon)',
  tuticorin: 'Thoothukudi (Tuticorin)',
};

function cleanDistrictRawName(raw: string): string {
  return raw
    .replace(/\b(district|dist\.?|dt\.?|mandal|taluk|tehsil)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKey(str: string): string {
  return cleanDistrictRawName(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function matchBestDistrict(state: State | '', apiDistrict: string): string {
  const cleanedRaw = cleanDistrictRawName(apiDistrict || '');
  if (!cleanedRaw) return '';

  const normApi = normalizeKey(cleanedRaw);
  const stateDistricts = state ? locations[state] || [] : [];

  // 1. Check explicit alias map first (handles K.V.Rangareddy, Cuddapah, Hanumakonda, Medchal, etc.)
  const aliasMatch = DISTRICT_ALIASES[normApi];
  if (aliasMatch) {
    if (!state || stateDistricts.length === 0 || stateDistricts.includes(aliasMatch)) {
      return aliasMatch;
    }
  }

  if (stateDistricts.length === 0) return cleanedRaw;

  // 2. Exact case-insensitive or normalized (ignoring spaces/hyphens/dots) match
  const exact = stateDistricts.find(
    (d) => d.toLowerCase() === cleanedRaw.toLowerCase() || normalizeKey(d) === normApi
  );
  if (exact) return exact;

  // 3. Careful substring match (only if the shorter string has at least 4 chars to avoid accidental hits)
  if (normApi.length >= 4) {
    const partial = stateDistricts.find((d) => {
      const normD = normalizeKey(d);
      return normD.includes(normApi) || (normD.length >= 4 && normApi.includes(normD));
    });
    if (partial) return partial;
  }

  // 4. NEVER fall back to stateDistricts[0] (which wrongly returns Adilabad / Alluri Sitharama Raju)!
  // Return the authentic cleaned district name from the API/GPS directly.
  return cleanedRaw;
}

export function areDistrictsMatching(
  districtA?: string,
  districtB?: string,
  state?: State | ''
): boolean {
  if (!districtA || !districtB) return false;
  const normA = normalizeKey(matchBestDistrict(state || '', districtA));
  const normB = normalizeKey(matchBestDistrict(state || '', districtB));
  if (!normA || !normB) return false;
  return normA === normB;
}

/**
 * India Post sometimes still lists pre-reorganization district names (e.g., "Chittoor" for Tirupati
 * or "Medak" for Siddipet). If the Post Office's Block or Division is itself an exact modern
 * district in the same state, resolve to that modern district name.
 */
function resolveModernDistrictFromPostOffice(state: State | '', po: PostalOfficeItem): string {
  if (state && locations[state]) {
    const stateDistricts = locations[state];
    const candidates = [po.Block, po.Division].filter(Boolean) as string[];

    for (const candidate of candidates) {
      const normCand = normalizeKey(candidate);
      if (!normCand || normCand === 'na' || normCand === 'notavailable') continue;

      const alias = DISTRICT_ALIASES[normCand];
      if (alias && stateDistricts.includes(alias)) {
        return alias;
      }

      const exactModern = stateDistricts.find((d) => normalizeKey(d) === normCand);
      if (exactModern) {
        return exactModern;
      }
    }
  }

  return matchBestDistrict(state, po.District);
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

    const rawFirstState = record.PostOffice[0]?.State || '';
    const matchedState = matchBestState(rawFirstState);

    const offices: PostalOfficeItem[] = record.PostOffice.map((po: any) => {
      const item: PostalOfficeItem = {
        Name: po.Name,
        Block: po.Block && po.Block !== 'NA' ? po.Block : po.Taluk || '',
        Division: po.Division || '',
        District: po.District || '',
        State: po.State || rawFirstState,
        Pincode: po.Pincode || cleanPin,
      };
      // Normalize each post office's district accurately
      item.District = resolveModernDistrictFromPostOffice(matchedState, item);
      return item;
    });

    const first = offices[0];

    return {
      isValid: true,
      pincode: cleanPin,
      state: matchedState,
      district: first.District,
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
            addr.hamlet ||
            addr.suburb ||
            addr.town ||
            addr.neighbourhood ||
            addr.city_district ||
            addr.city ||
            '';

          const gpsState = matchBestState(addr.state || '');
          // OpenStreetMap's `state_district` has the most accurate up-to-date Indian administrative district
          const rawGpsDistrict = addr.state_district || addr.county || addr.city || '';
          const gpsDistrict = rawGpsDistrict ? matchBestDistrict(gpsState, rawGpsDistrict) : '';

          if (rawPin && /^[1-9][0-9]{5}$/.test(rawPin)) {
            const pinCheck = await verifyIndianPinCode(rawPin);
            if (pinCheck.isValid) {
              const resolvedState = gpsState || pinCheck.state;
              // Prefer up-to-date GPS state_district over India Post's older district records
              const accurateDistrict =
                (addr.state_district ? matchBestDistrict(resolvedState, addr.state_district) : '') ||
                pinCheck.district ||
                gpsDistrict;

              // Pick the post office that best matches the user's real GPS locality
              const localityNorm = normalizeKey(detectedLocality);
              const matchedPo = localityNorm
                ? pinCheck.postOffices.find(
                    (po) =>
                      normalizeKey(po.Name) === localityNorm ||
                      normalizeKey(po.Name).includes(localityNorm) ||
                      localityNorm.includes(normalizeKey(po.Name))
                  )
                : undefined;

              // Update post offices list with the verified GPS district if they belong to this pincode
              const enrichedOffices = pinCheck.postOffices.map((po) => ({
                ...po,
                District: accurateDistrict || po.District,
              }));

              // If GPS detected a specific locality not listed as a head post office, keep it selectable at the top
              let finalVillage = matchedPo?.Name || pinCheck.postOffices[0]?.Name || detectedLocality;
              if (detectedLocality && !matchedPo) {
                const gpsLocalityItem: PostalOfficeItem = {
                  Name: detectedLocality,
                  Block: addr.county || addr.suburb || accurateDistrict,
                  District: accurateDistrict,
                  State: resolvedState || pinCheck.postOffices[0]?.State || '',
                  Pincode: rawPin,
                };
                enrichedOffices.unshift(gpsLocalityItem);
                finalVillage = detectedLocality;
              }

              return resolve({
                success: true,
                pincode: rawPin,
                village: finalVillage,
                district: accurateDistrict,
                state: resolvedState,
                postOffices: enrichedOffices,
                lat: latitude,
                lng: longitude,
              });
            }
          }

          const finalState = gpsState || 'Telangana';
          const finalDistrict = gpsDistrict || cleanDistrictRawName(rawGpsDistrict) || '';

          resolve({
            success: true,
            pincode: rawPin || '',
            village: detectedLocality || finalDistrict,
            district: finalDistrict,
            state: finalState,
            lat: latitude,
            lng: longitude,
          });
        } catch {
          resolve({
            success: false,
            errorTe: 'GPS నుండి చిరునామా పొందడం విఫలమైంది. దయచేసి మీ 6 అంకెల పిన్ కోడ్ నమోదు చేయండి.',
            errorEn: 'Could not resolve GPS address. Please enter your 6-digit Pin Code.',
          });
        }
      },
      (geoErr) => {
        const isDenied = geoErr?.code === 1;
        const isTimeout = geoErr?.code === 3;
        resolve({
          success: false,
          errorTe: isDenied
            ? 'లొకేషన్ అనుమతి ఇవ్వబడలేదు. దయచేసి బ్రౌజర్‌లో లొకేషన్ ఆన్ చేయండి లేదా మీ 6 అంకెల పిన్ కోడ్ నమోదు చేయండి.'
            : isTimeout
            ? 'GPS లొకేషన్ పొందడానికి ఎక్కువ సమయం పట్టింది. దయచేసి మీ 6 అంకెల పిన్ కోడ్ నమోదు చేయండి.'
            : 'ప్రస్తుతం GPS లొకేషన్ అందుబాటులో లేదు. దయచేసి మీ 6 అంకెల పిన్ కోడ్ నమోదు చేయండి.',
          errorEn: isDenied
            ? 'Location permission was not granted. Please enable location access or enter your 6-digit Pin Code.'
            : isTimeout
            ? 'GPS location timed out. Please enter your 6-digit Pin Code instead.'
            : 'GPS location is currently unavailable. Please enter your 6-digit Pin Code.',
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
