'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  getActiveMaskedCallForUser,
  updateMaskedCallStatus,
  SYNC_EVENT_NAME,
} from '@/lib/animals';
import type { MaskedCallSession } from '@/lib/definitions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff, Volume2, ShieldCheck, PhoneIncoming } from 'lucide-react';
import { Logo } from '@/components/icons/logo';

export default function MaskedCallOverlay() {
  const { user, language } = useAuth();
  const isTelugu = language === 'te';

  const [session, setSession] = useState<MaskedCallSession | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);

  const micStreamRef = useRef<MediaStream | null>(null);
  const ringTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoBridgeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync active call state across tabs & same-tab events
  useEffect(() => {
    if (!user) {
      setSession(null);
      return;
    }

    const syncCall = () => {
      const active = getActiveMaskedCallForUser(user.uid);
      setSession(active);
    };

    syncCall();

    const handleStorage = () => syncCall();
    window.addEventListener(SYNC_EVENT_NAME, handleStorage);
    window.addEventListener('storage', handleStorage);
    const poll = setInterval(syncCall, 1000);

    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleStorage);
      window.removeEventListener('storage', handleStorage);
      clearInterval(poll);
    };
  }, [user]);

  // Subtle Web Audio ring/dial tone while ringing
  useEffect(() => {
    if (!session || session.status !== 'ringing') {
      if (ringTimerRef.current) {
        clearInterval(ringTimerRef.current);
        ringTimerRef.current = null;
      }
      return;
    }

    let audioCtx: AudioContext | null = null;
    const playTone = () => {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtx) audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch {
        // Ignore autoplay restrictions
      }
    };

    playTone();
    ringTimerRef.current = setInterval(playTone, 2400);

    return () => {
      if (ringTimerRef.current) {
        clearInterval(ringTimerRef.current);
        ringTimerRef.current = null;
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, [session?.id, session?.status]);

  // If buyer initiated call and seller is not in an active second tab, bridge through Animal Bazaar voice relay after 4s
  useEffect(() => {
    if (!session || !user) return;
    if (session.status === 'ringing' && session.callerUid === user.uid) {
      autoBridgeTimerRef.current = setTimeout(() => {
        const current = getActiveMaskedCallForUser(user.uid);
        if (current && current.id === session.id && current.status === 'ringing') {
          const updated = updateMaskedCallStatus(session.id, 'connected');
          if (updated) setSession(updated);
        }
      }, 4000);
    }

    return () => {
      if (autoBridgeTimerRef.current) {
        clearTimeout(autoBridgeTimerRef.current);
        autoBridgeTimerRef.current = null;
      }
    };
  }, [session?.id, session?.status, session?.callerUid, user]);

  // Request microphone gently when call connects
  useEffect(() => {
    if (!session || session.status !== 'connected') {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      setElapsedSec(0);
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          micStreamRef.current = stream;
          stream.getAudioTracks().forEach((t) => {
            t.enabled = !isMuted;
          });
        })
        .catch(() => {
          // Audio mic permission optional in preview
        });
    }

    const startTime = session.connectedAt || Date.now();
    const timer = setInterval(() => {
      setElapsedSec(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.status]);

  useEffect(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  if (!user || !session || session.status === 'ended') {
    return null;
  }

  const isCaller = session.callerUid === user.uid;
  const isIncomingForSeller = !isCaller && session.status === 'ringing';

  const handleAnswerCall = () => {
    const updated = updateMaskedCallStatus(session.id, 'connected');
    if (updated) setSession(updated);
  };

  const handleEndCall = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    updateMaskedCallStatus(session.id, 'ended');
    setSession(null);
  };

  const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const secs = String(elapsedSec % 60).padStart(2, '0');

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-sm bg-gradient-to-b from-emerald-950 via-emerald-900 to-stone-950 text-white border-emerald-600/40 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            {isTelugu ? 'ఫోన్ నంబర్ దాచబడింది (Privacy Call)' : 'Number Hidden • Masked Relay'}
          </div>

          <div className="relative my-3">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg border-4 border-emerald-400/50">
              <Logo className="w-14 h-14 text-emerald-800" />
            </div>
            {session.status === 'ringing' && (
              <span className="absolute -inset-2 rounded-full border-2 border-emerald-400/60 animate-ping" />
            )}
          </div>

          {/* Strictly show ONLY "Animal Bazaar" to both Buyer & Seller - zero phone numbers */}
          <DialogTitle className="text-2xl font-extrabold tracking-tight text-white">
            Animal Bazaar
          </DialogTitle>

          <DialogDescription className="text-emerald-200/90 text-sm font-medium space-y-1">
            {isIncomingForSeller ? (
              <span className="flex items-center justify-center gap-1.5 text-amber-300 font-bold">
                <PhoneIncoming className="w-4 h-4 animate-bounce" />
                {isTelugu ? 'Animal Bazaar నుండి ఇన్‌కమింగ్ కాల్...' : 'Incoming Call via Animal Bazaar...'}
              </span>
            ) : session.status === 'ringing' ? (
              <span className="text-amber-300 font-semibold">
                {isTelugu ? 'Animal Bazaar ద్వారా కనెక్ట్ అవుతోంది...' : 'Calling via Animal Bazaar...'}
              </span>
            ) : (
              <span className="text-emerald-300 font-mono text-base font-bold tabular-nums">
                ● {isTelugu ? 'కనెక్ట్ అయింది' : 'Connected'} • {mins}:{secs}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-black/30 rounded-xl p-3 text-center border border-white/10 space-y-1">
          <p className="text-xs text-emerald-200/80 line-clamp-1 font-medium">
            {session.animalTitle}
          </p>
          <p className="text-[11px] text-emerald-300/75">
            {isTelugu
              ? 'ఇద్దరి ఫోన్ నంబర్లు గోప్యంగా ఉంచబడ్డాయి — Animal Bazaar పేరు మాత్రమే కనిపిస్తుంది.'
              : 'Both phone numbers are completely hidden. Only Animal Bazaar is shown.'}
          </p>
        </div>

        {/* Call Controls */}
        <div className="pt-3 pb-2">
          {isIncomingForSeller ? (
            <div className="flex items-center justify-center gap-6">
              <Button
                type="button"
                onClick={handleEndCall}
                className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg"
                title={isTelugu ? 'తిరస్కరించు' : 'Decline'}
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
              <Button
                type="button"
                onClick={handleAnswerCall}
                className="h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg animate-pulse"
                title={isTelugu ? 'మాట్లాడండి' : 'Answer'}
              >
                <Phone className="w-6 h-6" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsMuted((prev) => !prev)}
                className={`h-12 w-12 rounded-full border ${
                  isMuted
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              <Button
                type="button"
                onClick={handleEndCall}
                className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg"
                title={isTelugu ? 'కాల్ ముగించు' : 'End Call'}
              >
                <PhoneOff className="w-6 h-6" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSpeakerOn((prev) => !prev)}
                className={`h-12 w-12 rounded-full border ${
                  isSpeakerOn
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
                title="Speaker"
              >
                <Volume2 className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
