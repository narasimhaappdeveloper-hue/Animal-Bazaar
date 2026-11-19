import type { Animal, NotificationItem } from './definitions';

export const initialAnimals: Animal[] = [
  {
    id: '1',
    uid: 'farmer_101',
    userName: 'Rajesh Kumar',
    userPhone: '+919876543211',
    title: 'High-Yield HF Cow (హెచ్.ఎఫ్ ఆవు)',
    category: 'Cow',
    breed: 'HF',
    age: '2 years 6 months',
    price: 85000,
    location: 'Hyderabad',
    desc: '2nd lactation, yielding 20 liters milk per day. Very healthy, fully vaccinated, peaceful temperament.',
    imageUrl: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=800&q=80',
    imageHint: 'HF dairy cow in farm',
    status: 'active',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    featured: true,
  },
  {
    id: '2',
    uid: 'farmer_102',
    userName: 'Suresh Patel',
    userPhone: '+919876543212',
    title: 'Pure Murrah Buffalo (ముర్రా జాతి గేదె)',
    category: 'Buffalo',
    breed: 'Murrah',
    age: '3 years',
    price: 95000,
    location: 'Bengaluru Urban',
    desc: 'High-fat yield Murrah buffalo. Daily 18 liters milk capacity, 7.5% fat. Well maintained.',
    imageUrl: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80',
    imageHint: 'black murrah buffalo',
    status: 'active',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    featured: true,
  },
  {
    id: '3',
    uid: 'farmer_103',
    userName: 'Koteswara Rao',
    userPhone: '+919848023456',
    title: 'Pure Ongole Pair Oxen (ఒంగోలు గిత్తల జత)',
    category: 'Ox',
    breed: 'Pair Ox',
    age: '4 years',
    price: 135000,
    location: 'Guntur',
    desc: 'Majestic pure Ongole breed pair oxen. Extremely strong for agricultural work, cart pulling, and breeding. Fully trained.',
    imageUrl: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&w=800&q=80',
    imageHint: 'white indian ox pair',
    status: 'active',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    featured: true,
  },
  {
    id: '4',
    uid: 'farmer_104',
    userName: 'Venkata Ramana',
    userPhone: '+919988776655',
    title: 'Rare Punganur Dwarf Cow (పుంగనూరు ఆవు)',
    category: 'Cow',
    breed: 'Desi',
    age: '3 years 2 months',
    price: 110000,
    location: 'Chittoor',
    desc: 'Authentic pure lineage Punganur dwarf cow. High medicinal milk value, very affectionate, ideal for natural farming & gopuja.',
    imageUrl: 'https://images.unsplash.com/photo-1695902878213-f555035ac175?auto=format&fit=crop&w=800&q=80',
    imageHint: 'desi cow',
    status: 'active',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    featured: true,
  },
  {
    id: '5',
    uid: 'farmer_105',
    userName: 'Priya Sharma',
    userPhone: '+919876543214',
    title: 'Gir Milking Cow (గిర్ జాతి ఆవు)',
    category: 'Cow',
    breed: 'Gir',
    age: '2.5 years',
    price: 78000,
    location: 'Warangal',
    desc: 'Original Saurashtra Gir cow, A2 milk producer, heat-tolerant, disease-resistant. 14 liters per day.',
    imageUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=800&q=80',
    imageHint: 'gir indian cow',
    status: 'active',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    featured: true,
  },
  {
    id: '6',
    uid: 'farmer_106',
    userName: 'Deepak Reddy',
    userPhone: '+919876543215',
    title: 'Aseel Fighter Rooster (నాటు పందెం పుంజు)',
    category: 'Hen',
    breed: 'Country Hen',
    age: '11 months',
    price: 6500,
    location: 'West Godavari',
    desc: 'Purebred Bhimavaram Aseel rooster. 4.2 kg weight, aggressive posture, sturdy bone structure, disease free.',
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
    imageHint: 'aseel rooster',
    status: 'active',
    createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
  },
  {
    id: '7',
    uid: 'farmer_107',
    userName: 'Narasimha Rao',
    userPhone: '+919701234567',
    title: 'Barbari & Sirohi Breeding Goats (మేకల మంద)',
    category: 'Goat',
    breed: 'Barbari',
    age: '1 year 4 months',
    price: 14000,
    location: 'Karimnagar',
    desc: 'Pure Barbari breeding goats. Rapid growth rate, gives twins frequently, ideal for stall-fed commercial goat farming.',
    imageUrl: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=800&q=80',
    imageHint: 'brown and white goat',
    status: 'active',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: '8',
    uid: 'farmer_108',
    userName: 'Subba Reddy',
    userPhone: '+919618123456',
    title: 'Nellore Jodipi Sheep (నెల్లూరు జోడిపి గొర్రెలు)',
    category: 'Sheep',
    breed: 'Nellore',
    age: '1 year 8 months',
    price: 18500,
    location: 'Sri Potti Sriramulu Nellore',
    desc: 'Authentic Nellore Jodipi tall white breed ram. High weight gain performance, ideal breeding stock.',
    imageUrl: 'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=800&q=80',
    imageHint: 'nellore white sheep',
    status: 'active',
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
  },
  {
    id: '9',
    uid: 'farmer_109',
    userName: 'Mohammad Ali',
    userPhone: '+919849554433',
    title: 'Pure White Homer Racing Pigeons (జాతి పావురాలు)',
    category: 'Pigeon',
    breed: 'Homer',
    age: '1.5 years',
    price: 4500,
    location: 'Nalgonda',
    desc: 'Pair of pure white Homer racing pigeons. Excellent homing instincts, vaccinated and dewormed.',
    imageUrl: 'https://images.unsplash.com/photo-1555169062-013468b47731?auto=format&fit=crop&w=800&q=80',
    imageHint: 'racing homing pigeon',
    status: 'active',
    createdAt: Date.now() - 9 * 24 * 60 * 60 * 1000,
  },
  {
    id: '10',
    uid: 'farmer_110',
    userName: 'Chandra Sekhar',
    userPhone: '+919440123987',
    title: 'Healthy Yorkshire Pigs (యోర్క్‌షైర్ పందులు)',
    category: 'Pig',
    breed: 'Yorkshire',
    age: '3 months',
    price: 9000,
    location: 'Vijayawada',
    desc: 'Vaccinated large white Yorkshire breeding piglets. High conversion ratio, active and healthy.',
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
    imageHint: 'yorkshire pigs farm',
    status: 'active',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    id: '11',
    uid: 'farmer_111',
    userName: 'Ravi Teja',
    userPhone: '+919848556677',
    title: 'Trained German Shepherd Farm Dog (జర్మన్ షెపర్డ్)',
    category: 'Dog',
    breed: 'German Shepherd',
    age: '1 year 2 months',
    price: 22000,
    location: 'Visakhapatnam',
    desc: 'Well-trained German Shepherd guard dog for farmhouses & cattle sheds. KCI registered, fully vaccinated.',
    imageUrl: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=800&q=80',
    imageHint: 'german shepherd farm dog',
    status: 'active',
    createdAt: Date.now() - 11 * 24 * 60 * 60 * 1000,
  }
];

export const animals: Animal[] = [...initialAnimals];

const STORAGE_KEY = 'animal_bazaar_posts';
const FAVORITES_KEY = 'animal_bazaar_favorites';
const NOTIFICATIONS_KEY = 'animal_bazaar_notifications';
const CALL_REQUESTS_KEY = 'animal_bazaar_call_requests';
const MASKED_CALLS_KEY = 'animal_bazaar_masked_calls';

export const SYNC_EVENT_NAME = 'animal_bazaar_sync';

function emitSyncEvent() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SYNC_EVENT_NAME));
}

export function getStoredAnimals(): Animal[] {
  if (typeof window === 'undefined') {
    return animals;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAnimals));
      return initialAnimals;
    }
    const parsed: Animal[] = JSON.parse(raw);
    const brokenUrl = 'photo-1527153857715-3908f2ae5e81';
    const fixedCowUrl = 'https://images.unsplash.com/photo-1695902878213-f555035ac175?auto=format&fit=crop&w=800&q=80';
    let didRepair = false;
    const repaired = parsed.map((item) => {
      if (item.imageUrl && item.imageUrl.includes(brokenUrl)) {
        didRepair = true;
        return { ...item, imageUrl: fixedCowUrl };
      }
      return item;
    });
    if (didRepair) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(repaired));
    }
    return repaired;
  } catch (err) {
    console.error('Failed to parse animals from localStorage:', err);
    return animals;
  }
}

export function saveAnimalsToStorage(posts: Animal[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    // sync in-memory array
    animals.length = 0;
    animals.push(...posts);
    emitSyncEvent();
  } catch (err) {
    console.error('Failed to save animals to localStorage:', err);
  }
}

export function addAnimal(animal: Animal): void {
  const current = getStoredAnimals();
  const updated = [animal, ...current];
  saveAnimalsToStorage(updated);
}

export function updateAnimalStatus(id: string, status: 'active' | 'closed'): void {
  const current = getStoredAnimals();
  const updated = current.map(item => (item.id === id ? { ...item, status } : item));
  saveAnimalsToStorage(updated);
}

export function deleteAnimal(id: string): void {
  const current = getStoredAnimals();
  const updated = current.filter(item => item.id !== id);
  saveAnimalsToStorage(updated);
}

// Favorites persistence
export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to get favorites from storage:', err);
    return [];
  }
}

export function toggleFavorite(id: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const favs = getFavorites();
    let updated: string[];
    let isNowFavorite = false;
    if (favs.includes(id)) {
      updated = favs.filter(favId => favId !== id);
    } else {
      updated = [...favs, id];
      isNowFavorite = true;
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    emitSyncEvent();
    return isNowFavorite;
  } catch (err) {
    console.error('Failed to toggle favorite in storage:', err);
    return false;
  }
}

// Notifications persistence
export function getStoredNotifications(userId?: string): NotificationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const list: NotificationItem[] = raw ? JSON.parse(raw) : [];
    if (userId) {
      return list.filter(item => item.userId === userId);
    }
    return list;
  } catch (err) {
    console.error('Failed to read notifications from storage:', err);
    return [];
  }
}

export function addNotification(item: NotificationItem): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredNotifications();
    const updated = [item, ...list];
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    emitSyncEvent();
  } catch (err) {
    console.error('Failed to save notification to storage:', err);
  }
}

export function markNotificationRead(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredNotifications();
    const updated = list.map(n => (n.id === id ? { ...n, read: true } : n));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    emitSyncEvent();
  } catch (err) {
    console.error('Failed to mark notification as read:', err);
  }
}

// Call Request & Approval Persistence (Privacy-Preserving: Zero Phone Exposure)
export function getCallRequests(filter?: { sellerUid?: string; buyerUid?: string }): import('./definitions').CallRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CALL_REQUESTS_KEY);
    const list: import('./definitions').CallRequest[] = raw ? JSON.parse(raw) : [];
    if (filter?.sellerUid) {
      return list.filter((r) => r.sellerUid === filter.sellerUid);
    }
    if (filter?.buyerUid) {
      return list.filter((r) => r.buyerUid === filter.buyerUid);
    }
    return list;
  } catch (err) {
    console.error('Failed to read call requests:', err);
    return [];
  }
}

export function getCallRequestForBuyerAndAnimal(
  buyerUid: string,
  animalId: string
): import('./definitions').CallRequest | null {
  const list = getCallRequests({ buyerUid });
  return list.find((r) => r.animalId === animalId) || null;
}

export function createCallRequest(params: {
  animal: Animal;
  buyerUid: string;
}): import('./definitions').CallRequest {
  const all = getCallRequests();
  const existing = all.find(
    (r) => r.animalId === params.animal.id && r.buyerUid === params.buyerUid
  );
  if (existing && existing.status !== 'rejected') {
    return existing;
  }

  const now = Date.now();
  const reqId = 'callreq_' + now.toString(36) + Math.random().toString(36).slice(2, 6);
  const newReq: import('./definitions').CallRequest = {
    id: reqId,
    animalId: params.animal.id,
    animalTitle: params.animal.title,
    sellerUid: params.animal.uid,
    buyerUid: params.buyerUid,
    buyerLabel: 'Animal Bazaar',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const filtered = existing ? all.filter((r) => r.id !== existing.id) : all;
  localStorage.setItem(CALL_REQUESTS_KEY, JSON.stringify([newReq, ...filtered]));

  // Send privacy-masked notification to Seller (shows Animal Bazaar, NO phone number)
  addNotification({
    id: 'notif_' + now.toString(36),
    userId: params.animal.uid,
    title: `Animal Bazaar — కొత్త కాల్ రిక్వెస్ట్ (Call Request)`,
    message: `'${params.animal.title}' కోసం Animal Bazaar ద్వారా కాల్ అభ్యర్థన వచ్చింది. మీరు అంగీకరిస్తేనే కాల్ కనెక్ట్ అవుతుంది.`,
    type: 'call_request',
    createdAt: now,
    read: false,
    animalId: params.animal.id,
    callRequestId: reqId,
    senderName: 'Animal Bazaar',
  });

  emitSyncEvent();
  return newReq;
}

export function respondToCallRequest(
  requestId: string,
  decision: 'accepted' | 'rejected'
): import('./definitions').CallRequest | null {
  if (typeof window === 'undefined') return null;
  const all = getCallRequests();
  let updatedReq: import('./definitions').CallRequest | null = null;
  const now = Date.now();

  const updated = all.map((r) => {
    if (r.id === requestId) {
      updatedReq = { ...r, status: decision, updatedAt: now };
      return updatedReq;
    }
    return r;
  });

  localStorage.setItem(CALL_REQUESTS_KEY, JSON.stringify(updated));

  if (updatedReq) {
    const reqObj = updatedReq as import('./definitions').CallRequest;
    // Mark seller notification read
    const notifs = getStoredNotifications();
    const updatedNotifs = notifs.map((n) =>
      n.callRequestId === requestId ? { ...n, read: true } : n
    );
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));

    // Notify buyer of decision (only showing "Animal Bazaar", never seller phone)
    addNotification({
      id: 'notif_resp_' + now.toString(36),
      userId: reqObj.buyerUid,
      title:
        decision === 'accepted'
          ? 'Animal Bazaar — కాల్ అభ్యర్థన ఆమోదించబడింది ✓'
          : 'Animal Bazaar — కాల్ అభ్యర్థన తిరస్కరించబడింది',
      message:
        decision === 'accepted'
          ? `'${reqObj.animalTitle}' కోసం మీ కాల్ రిక్వెస్ట్ ఆమోదించబడింది. ఇప్పుడు మీరు "Call Seller Now" ద్వారా Animal Bazaar పేరుతో మాట్లాడవచ్చు.`
          : `'${reqObj.animalTitle}' కోసం మీ కాల్ రిక్వెస్ట్ ప్రస్తుతానికి తిరస్కరించబడింది.`,
      type: decision === 'accepted' ? 'call_accepted' : 'call_rejected',
      createdAt: now,
      read: false,
      animalId: reqObj.animalId,
      callRequestId: reqObj.id,
      senderName: 'Animal Bazaar',
    });
  }

  emitSyncEvent();
  return updatedReq;
}

// Masked In-App Call Session Management (Both parties see only "Animal Bazaar")
export function getMaskedCalls(): import('./definitions').MaskedCallSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MASKED_CALLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function startMaskedCall(params: {
  requestId: string;
  animalId: string;
  animalTitle: string;
  callerUid: string;
  calleeUid: string;
}): import('./definitions').MaskedCallSession {
  const now = Date.now();
  const session: import('./definitions').MaskedCallSession = {
    id: 'mcall_' + now.toString(36) + Math.random().toString(36).slice(2, 5),
    requestId: params.requestId,
    animalId: params.animalId,
    animalTitle: params.animalTitle,
    callerUid: params.callerUid,
    calleeUid: params.calleeUid,
    status: 'ringing',
    startedAt: now,
  };

  const existing = getMaskedCalls().filter((c) => c.status !== 'ended');
  localStorage.setItem(MASKED_CALLS_KEY, JSON.stringify([session, ...existing]));
  emitSyncEvent();
  return session;
}

export function updateMaskedCallStatus(
  callId: string,
  status: 'connected' | 'ended'
): import('./definitions').MaskedCallSession | null {
  const all = getMaskedCalls();
  let target: import('./definitions').MaskedCallSession | null = null;
  const updated = all.map((c) => {
    if (c.id === callId) {
      target = {
        ...c,
        status,
        connectedAt: status === 'connected' ? c.connectedAt || Date.now() : c.connectedAt,
      };
      return target;
    }
    return c;
  });
  localStorage.setItem(MASKED_CALLS_KEY, JSON.stringify(updated));
  emitSyncEvent();
  return target;
}

export function getActiveMaskedCallForUser(
  uid: string
): import('./definitions').MaskedCallSession | null {
  const now = Date.now();
  // Consider calls active within the last 30 minutes that aren't ended
  const active = getMaskedCalls().filter(
    (c) =>
      c.status !== 'ended' &&
      now - c.startedAt < 30 * 60 * 1000 &&
      (c.calleeUid === uid || c.callerUid === uid)
  );
  return active[0] || null;
}
