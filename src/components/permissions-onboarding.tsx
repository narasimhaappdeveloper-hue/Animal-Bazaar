'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, MapPin, CheckCircle2, ShieldCheck, Loader2, Download } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { detectVerifiedGpsLocation } from '@/lib/address-verifier';
import { useToast } from '@/hooks/use-toast';

const PERMISSIONS_STORAGE_KEY = 'animal_bazaar_device_permissions_v1';
export const VERIFIED_LOCATION_STORAGE_KEY = 'animal_bazaar_verified_location';

export interface StoredDevicePermissions {
  cameraGranted: boolean;
  galleryGranted: boolean;
  locationGranted: boolean;
  completedAt: number;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PermissionsOnboarding() {
  const { language } = useAuth();
  const { toast } = useToast();
  const isTelugu = language === 'te';

  const [open, setOpen] = useState(false);
  const [cameraOk, setCameraOk] = useState(false);
  const [galleryOk, setGalleryOk] = useState(false);
  const [locationOk, setLocationOk] = useState(false);
  const [detectedPlace, setDetectedPlace] = useState<string>('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    try {
      const saved = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
      if (!saved) {
        // Show onboarding prompt after brief initial settle
        const timer = setTimeout(() => {
          setOpen(true);
        }, 1200);
        return () => {
          clearTimeout(timer);
          window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
      } else {
        const parsed: StoredDevicePermissions = JSON.parse(saved);
        setCameraOk(parsed.cameraGranted);
        setGalleryOk(parsed.galleryGranted);
        setLocationOk(parsed.locationGranted);
      }
    } catch (err) {
      console.error('Error reading permissions state:', err);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleGrantAllPermissions = async () => {
    setIsRequesting(true);
    let camGranted = cameraOk;
    let locGranted = locationOk;

    // 1. Request Camera Permission
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        camGranted = true;
        setCameraOk(true);
      } catch {
        // User denied camera or device has no camera; gallery upload remains available
        camGranted = false;
      }
    }

    // 2. Gallery access is enabled alongside file/media picker
    setGalleryOk(true);

    // 3. Request GPS Location & Reverse Geocode real address
    try {
      const gpsResult = await detectVerifiedGpsLocation();
      if (gpsResult.success) {
        locGranted = true;
        setLocationOk(true);
        const summary = [gpsResult.village, gpsResult.district, gpsResult.pincode]
          .filter(Boolean)
          .join(', ');
        setDetectedPlace(summary);
        localStorage.setItem(VERIFIED_LOCATION_STORAGE_KEY, JSON.stringify(gpsResult));
      }
    } catch {
      // Fallback to 6-digit Pin Code verification in forms
      locGranted = false;
    }

    // 4. Trigger PWA install prompt if available
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        setDeferredPrompt(null);
      } catch {
        // Install prompt dismissed or unsupported
      }
    }

    const stateToSave: StoredDevicePermissions = {
      cameraGranted: camGranted,
      galleryGranted: true,
      locationGranted: locGranted,
      completedAt: Date.now(),
    };
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(stateToSave));
    setIsRequesting(false);

    toast({
      title: isTelugu ? 'అనుమతులు సిద్ధంగా ఉన్నాయి!' : 'Permissions Configured!',
      description: isTelugu
        ? 'కెమెరా, గ్యాలరీ మరియు GPS లొకేషన్ అనుమతులు విజయవంతంగా సెట్ చేయబడ్డాయి.'
        : 'Camera, Gallery, and GPS Location permissions have been configured.',
    });

    setTimeout(() => {
      setOpen(false);
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-emerald-100 text-emerald-800 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            {isTelugu
              ? 'యాప్ అనుమతులు (Camera, Gallery & Location)'
              : 'App Permissions Setup'}
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            {isTelugu
              ? 'పశువుల నిజమైన ఫోటోలు తీయడానికి మరియు నకిలీ చిరునామాలను నిరోధించడానికి ఈ అనుమతులను ఆన్ చేయండి.'
              : 'Enable Camera, Gallery, and GPS Location to capture real animal photos and verify genuine addresses.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="p-2 rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
              <Camera className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">
                  {isTelugu ? 'కెమెరా (Camera Permission)' : 'Camera Access'}
                </h4>
                {cameraOk && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {isTelugu
                  ? 'పశువుల ప్రత్యక్ష ఫోటోలు తీసి AI ద్వారా ధ్రువీకరించడానికి.'
                  : 'Directly capture live photos of your cattle and livestock.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="p-2 rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">
                  {isTelugu ? 'ఫోటో గ్యాలరీ (Photo Gallery)' : 'Photo Gallery Access'}
                </h4>
                {galleryOk && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {isTelugu
                  ? 'మీ ఫోన్‌లో ఉన్న స్పష్టమైన పశువుల ఫోటోలను ఎంచుకోవడానికి.'
                  : 'Select clear animal photos from your phone storage.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="p-2 rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">
                  {isTelugu ? 'GPS లొకేషన్ (Real Address Verification)' : 'GPS Location Access'}
                </h4>
                {locationOk && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {isTelugu
                  ? 'నకిలీ చిరునామాలు లేకుండా మీ నిజమైన గ్రామం, జిల్లా & పిన్ కోడ్ గుర్తించడానికి.'
                  : 'Automatically verify your real village, district, and Pin Code.'}
              </p>
              {detectedPlace && (
                <p className="text-xs font-semibold text-emerald-700 mt-1">
                  ✓ {detectedPlace}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            className="w-full font-bold h-11"
            onClick={handleGrantAllPermissions}
            disabled={isRequesting}
          >
            {isRequesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isTelugu ? 'అనుమతులు తీసుకుంటోంది...' : 'Requesting Permissions...'}
              </>
            ) : (
              <>
                {deferredPrompt ? <Download className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {isTelugu ? 'అన్ని అనుమతులు ఇవ్వండి (Allow All)' : 'Allow Permissions & Continue'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
