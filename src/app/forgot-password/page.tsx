'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updatePassword,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Phone, Lock, KeyRound, Loader2, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<'phone' | 'otp' | 'new-password'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Invisible reCAPTCHA initialization
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved automatically
        },
      });
    }
  };

  // 1. ఫోన్ నంబర్‌కి OTP పంపడం
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
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
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier;

      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setStep('otp');

      toast({
        title: 'OTP పంపబడింది!',
        description: `${formattedPhone} నంబర్‌కు 6 అంకెల వెరిఫికేషన్ కోడ్ వచ్చింది.`,
      });
    } catch (error: any) {
      console.error('OTP Send Error:', error);
      toast({
        variant: 'destructive',
        title: 'OTP పంపడం విఫలమైంది',
        description: error.message || 'Firebase లో Phone Auth ఎనేబుల్ అయిందో లేదో తనిఖీ చేయండి.',
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. OTP ని ధృవీకరించడం
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
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
        setStep('new-password');
        toast({
          title: 'OTP వెరిఫై అయ్యింది ✓',
          description: 'ఇప్పుడు మీ కొత్త పాస్‌వర్డ్‌ను సెట్ చేయండి.',
        });
      }
    } catch (error: any) {
      console.error('OTP Verify Error:', error);
      toast({
        variant: 'destructive',
        title: 'OTP చెల్లదు',
        description: 'మీరు నమోదు చేసిన OTP తప్పు లేదా గడువు ముగిసింది.',
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. కొత్త పాస్‌వర్డ్‌ను సేవ్ చేయడం
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'పాస్‌వర్డ్ సరిపోదు',
        description: 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'పాస్‌వర్డ్ సరిపోలలేదు',
        description: 'రెండు ఫీల్డ్స్‌లో ఒకే పాస్‌వర్డ్ ఇవ్వండి.',
      });
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updatePassword(currentUser, newPassword);
        toast({
          title: 'పాస్‌వర్డ్ అప్‌డేట్ అయ్యింది! ✓',
          description: 'మీ కొత్త పాస్‌వర్డ్‌తో లాగిన్ అవ్వండి.',
        });
        router.push('/login');
      } else {
        throw new Error('సెషన్ గడువు ముగిసింది. దయచేసి మళ్లీ OTP తీసుకోండి.');
      }
    } catch (error: any) {
      console.error('Password Update Error:', error);
      toast({
        variant: 'destructive',
        title: 'లోపం జరిగింది',
        description: error.message || 'పాస్‌వర్డ్ మార్చడం సాధ్యం కాలేదు.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-8">
      {/* Invisible Recaptcha Element */}
      <div id="recaptcha-container"></div>

      <Card className="w-full max-w-sm shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            {step === 'phone' && 'మొబైల్ నంబర్ ద్వారా SMS OTP పొందండి'}
            {step === 'otp' && 'మీ ఫోన్‌కు వచ్చిన 6 అంకెల కోడ్ ఇవ్వండి'}
            {step === 'new-password' && 'మీ కొత్త పాస్‌వర్డ్‌ను నమోదు చేయండి'}
          </CardDescription>
        </CardHeader>

        {/* STEP 1: PHONE NUMBER FORM */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">మొబైల్ నంబర్ (Phone Number)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-semibold text-muted-foreground">+91</span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="pl-12"
                    required
                  />
                  <Phone className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full font-semibold py-5" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    SMS పంపుతోంది...
                  </>
                ) : (
                  'Send OTP (OTP పంపండి)'
                )}
              </Button>
              <div className="text-center text-sm pt-2">
                గుర్తుందా?{' '}
                <Link href="/login" className="underline text-primary font-medium">
                  లాగిన్ అవ్వండి
                </Link>
              </div>
            </CardFooter>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION FORM */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="otp">6 అంకెల OTP నమోదు చేయండి</Label>
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
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ధృవీకరిస్తోంది...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Verify OTP
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-xs text-muted-foreground hover:underline text-center mt-1"
              >
                తప్పు నంబరా? (మళ్లీ నంబర్ ఇవ్వండి)
              </button>
            </CardFooter>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD FORM */}
        {step === 'new-password' && (
          <form onSubmit={handleUpdatePassword}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="newPassword">కొత్త పాస్‌వర్డ్ (New Password)</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="కనీసం 6 అక్షరాలు"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">పాస్‌వర్డ్ నిర్ధారించండి (Confirm Password)</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="మళ్లీ టైప్ చేయండి"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full font-semibold py-5" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    అప్‌డేట్ అవుతోంది...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    పాస్‌వర్డ్ మార్చండి
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

// Global TypeScript declaration for RecaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
