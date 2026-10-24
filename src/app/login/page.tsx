'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signInWithPopup, 
  GoogleAuthProvider, 
  ConfirmationResult 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Phone, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M44,24c0-1.341-0.138-2.65-0.389-3.917H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C41.31,34.136,44,29.5,44,24z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'login-recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });
    }
  };

  // 1. రియల్ ఫోన్ SMS OTP లాగిన్
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast({
        variant: 'destructive',
        title: 'తప్పు నంబర్',
        description: 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.',
      });
      return;
    }

    setLoading(true);
    try {
      setupRecaptcha();
      const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 
        ? `+${cleanPhone}` 
        : `+91${cleanPhone.slice(-10)}`;
        
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setStep('otp');

      toast({
        title: 'OTP పంపబడింది!',
        description: `${formattedPhone} కు 6 అంకెల వెరిఫికేషన్ కోడ్ వచ్చింది.`,
      });
    } catch (error: any) {
      console.error('Phone Sign-in Error:', error);
      toast({
        variant: 'destructive',
        title: 'OTP విఫలమైంది',
        description: error.message || 'Firebase లో Phone Auth ఎనేబుల్ అయిందో లేదో చూడండి.',
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. OTP ధృవీకరణ
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'తప్పు OTP',
        description: 'దయచేసి 6 అంకెల OTP ని నమోదు చేయండి.',
      });
      return;
    }

    setLoading(true);
    try {
      if (!confirmationResult) return;
      const userCredential = await confirmationResult.confirm(otp);
      const user = userCredential.user;

      // యూజర్ డాక్యుమెంట్ Firestore లో ఉందో లేదో సరిచూడటం
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          phone: user.phoneNumber,
          name: 'Farmer/User',
          role: 'both',
          createdAt: serverTimestamp(),
        });
      }

      toast({
        title: 'లాగిన్ విజయవంతం! ✓',
        description: 'Animal Bazaar కు స్వాగతం.',
      });

      router.push('/');
    } catch (error: any) {
      console.error('OTP Verification Error:', error);
      toast({
        variant: 'destructive',
        title: 'OTP సరిపోలలేదు',
        description: 'సరైన OTP ఇవ్వండి లేదా మళ్లీ ప్రయత్నించండి.',
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. రియల్ Google Sign-In
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'Google User',
          email: user.email || '',
          phone: user.phoneNumber || '',
          role: 'both',
          createdAt: serverTimestamp(),
        });
      }

      toast({
        title: 'Google లాగిన్ విజయవంతం! ✓',
        description: `స్వాగతం ${user.displayName || ''}!`,
      });

      router.push('/');
    } catch (error: any) {
      console.error('Google Sign-in Error:', error);
      toast({
        variant: 'destructive',
        title: 'Google లాగిన్ విఫలమైంది',
        description: error.message || 'గూగుల్ ద్వారా సైన్ ఇన్ సాధ్యం కాలేదు.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div id="login-recaptcha-container"></div>

      <Card className="w-full max-w-sm shadow-md border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            {step === 'phone' 
              ? 'Enter your mobile number to sign in with OTP.' 
              : 'Enter the 6-digit OTP sent to your phone.'}
          </CardDescription>
        </CardHeader>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number (మొబైల్ నంబర్)</Label>
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

              <div className="flex items-center justify-end">
                <Link href="/forgot-password" className="text-xs underline text-primary">
                  Forgot your password?
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full py-5 font-semibold" type="submit" disabled={loading || googleLoading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send OTP (OTP పంపండి)
              </Button>

              <div className="relative w-full">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-card px-2 text-xs text-muted-foreground">OR</span>
              </div>

              <Button 
                variant="outline" 
                type="button" 
                className="w-full" 
                onClick={handleGoogleLogin} 
                disabled={loading || googleLoading}
              >
                {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                Sign in with Google
              </Button>

              <div className="text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="underline text-primary font-semibold">
                  Register
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="otp">Enter 6-Digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
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
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 font-semibold" type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Verify & Login
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                type="button" 
                onClick={() => setStep('phone')} 
                className="text-xs text-muted-foreground"
              >
                <ArrowLeft className="mr-1 h-3 w-3" /> Change Number (నంబర్ మార్చాలా?)
              </Button>
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
