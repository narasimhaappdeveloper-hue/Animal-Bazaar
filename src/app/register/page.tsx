'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Phone, User, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'register-recaptcha', {
        size: 'invisible',
        callback: () => {},
      });
    }
  };

  // 1. మొబైల్ నంబర్‌కి SMS OTP పంపడం
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast({
        variant: 'destructive',
        title: 'తప్పు నంబర్',
        description: 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి.',
      });
      return;
    }

    setLoading(true);
    try {
      setupRecaptcha();
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const appVerifier = window.recaptchaVerifier;

      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setStep('otp');

      toast({
        title: 'OTP పంపబడింది!',
        description: `${formattedPhone} కు 6 అంకెల వెరిఫికేషన్ కోడ్ వచ్చింది.`,
      });
    } catch (error: any) {
      console.error('Registration Error:', error);
      toast({
        variant: 'destructive',
        title: 'రిజిస్ట్రేషన్ విఫలమైంది',
        description: error.message || 'Firebase లో Phone Auth ఎనేబుల్ అయిందో లేదో చూడండి.',
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. OTP వెరిఫై చేసి Firestore లో యూజర్‌ను సేవ్ చేయడం
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'తప్పు OTP',
        description: 'దయచేసి 6 అంకెల OTP నమోదు చేయండి.',
      });
      return;
    }

    setLoading(true);
    try {
      if (!confirmationResult) return;
      const userCredential = await confirmationResult.confirm(otp);
      const user = userCredential.user;

      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      
      // Firestore 'users' టేబుల్‌లో సేవ్ చేయడం
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name.trim(),
        phone: formattedPhone,
        location: location.trim(),
        role: 'both',
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'రిజిస్ట్రేషన్ విజయవంతం! ✓',
        description: `స్వాగతం ${name}! మీ ఖాతా సిద్ధమైంది.`,
      });

      router.push('/');
    } catch (error: any) {
      console.error('OTP Error:', error);
      toast({
        variant: 'destructive',
        title: 'OTP సరిపోలలేదు',
        description: 'నమోదు చేసిన OTP తప్పు లేదా గడువు ముగిసింది.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-8">
      {/* Invisible Recaptcha */}
      <div id="register-recaptcha"></div>

      <Card className="w-full max-w-sm shadow-lg border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">నమోదు చేసుకోండి (Register)</CardTitle>
          <CardDescription>Animal Bazaar లో చేరి జంతువులను కొనండి లేదా అమ్మండి</CardDescription>
        </CardHeader>

        {step === 'details' && (
          <form onSubmit={handleSendOtp}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">మీ పూర్తి పేరు (Full Name)</Label>
                <div className="relative">
                  <Input
                    id="name"
                    placeholder="రాము / వెంకట్"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">మొబైల్ నంబర్ (Phone Number)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-semibold text-muted-foreground">+91</span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="pl-12"
                    required
                  />
                  <Phone className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">గ్రామం / జిల్లా (Location)</Label>
                <div className="relative">
                  <Input
                    id="location"
                    placeholder="ఉదా: గుంటూరు / ఖమ్మం"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                  <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full font-semibold py-5" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                OTP పంపండి (Get OTP)
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                ఇప్పటికే ఖాతా ఉందా?{' '}
                <Link href="/login" className="underline text-primary font-medium">
                  లాగిన్ అవ్వండి
                </Link>
              </p>
            </CardFooter>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyAndRegister}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="otp">6 అంకెల OTP ని నమోదు చేయండి</Label>
                <Input
                  id="otp"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-[0.4em] font-mono font-bold"
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                రిజిస్ట్రేషన్ పూర్తి చేయండి
              </Button>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-xs text-muted-foreground hover:underline text-center"
              >
                వివరాలు మార్చాలా? (వెనక్కి వెళ్ళండి)
              </button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
