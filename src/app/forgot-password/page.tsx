'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  Phone,
  Lock,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { language } = useAuth();
  const isTelugu = language === 'te';

  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [showSmsBanner, setShowSmsBanner] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'మొబైల్ నంబర్ అవసరం' : 'Valid Phone Required',
        description: isTelugu
          ? 'దయచేసి మీ 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.'
          : 'Please enter a valid 10-digit registered phone number.',
      });
      return;
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpSent(true);
    setOtpError(null);
    setCountdown(30);
    setShowSmsBanner(true);

    toast({
      title: isTelugu ? 'OTP పంపబడింది!' : 'OTP Sent Successfully!',
      description: isTelugu
        ? `మీ నంబర్ ${cleanPhone} కు 6 అంకెల OTP పంపబడింది.`
        : `Verification OTP has been sent to ${cleanPhone}.`,
    });
  };

  const handleVerifyOtp = () => {
    if (!otpValue || otpValue.trim() !== generatedOtp) {
      setOtpError(
        isTelugu
          ? 'మీరు నమోదు చేసిన OTP సరైనది కాదు. మళ్ళీ ప్రయత్నించండి.'
          : 'Invalid OTP. Please enter the correct code.'
      );
      toast({
        variant: 'destructive',
        title: isTelugu ? 'తప్పు OTP' : 'Incorrect OTP',
        description: isTelugu ? 'దయచేసి సరైన OTP నమోదు చేయండి.' : 'Please enter the correct 6-digit OTP.',
      });
      return;
    }

    setIsPhoneVerified(true);
    setOtpError(null);
    setShowSmsBanner(false);

    toast({
      title: isTelugu ? 'OTP ధ్రువీకరణ విజయవంతమైంది!' : 'OTP Verified Successfully!',
      description: isTelugu
        ? 'ఇప్పుడు మీ కొత్త పాస్‌వర్డ్ నమోదు చేయవచ్చు.'
        : 'You can now set your new password.',
    });
  };

  const handleAutoFillOtp = () => {
    if (generatedOtp) {
      setOtpValue(generatedOtp);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPhoneVerified) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'OTP ధ్రువీకరణ అవసరం' : 'OTP Verification Required',
        description: isTelugu
          ? 'పాస్‌వర్డ్ మార్చడానికి ముందుగా మొబైల్ OTP ధ్రువీకరించండి.'
          : 'Please verify your phone via OTP before updating password.',
      });
      return;
    }

    if (newPassword.length < 4) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'పాస్‌వర్డ్ చాలా చిన్నది' : 'Password Too Short',
        description: isTelugu
          ? 'పాస్‌వర్డ్ కనీసం 4 అక్షరాలు ఉండాలి.'
          : 'Password must be at least 4 characters.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'పాస్‌వర్డ్‌లు సరిపోలలేదు' : 'Passwords Do Not Match',
        description: isTelugu
          ? 'రెండు పాస్‌వర్డ్‌లు ఒకే విధంగా ఉండాలి.'
          : 'Both password fields must match.',
      });
      return;
    }

    try {
      const USERS_DB_KEY = 'animal_bazaar_registered_users';
      const cleanPhone = phone.trim();
      const rawUsers = typeof window !== 'undefined' ? localStorage.getItem(USERS_DB_KEY) : null;
      const users = rawUsers ? JSON.parse(rawUsers) : {};

      if (users[cleanPhone]) {
        users[cleanPhone].password = newPassword;
      } else {
        // If not already in DB, save credentials so they can log in
        const digits = cleanPhone.replace(/\D/g, '');
        users[cleanPhone] = {
          user: {
            uid: 'user_' + Date.now().toString(36),
            name: `రైతు / Farmer ${digits.slice(-4)}`,
            email: `${digits}@animalbazaar.in`,
            phone: cleanPhone,
            state: 'Telangana',
            district: 'Hyderabad',
            createdAt: Date.now(),
            lastActive: Date.now(),
          },
          password: newPassword,
        };
      }

      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
      setIsResetSuccess(true);

      toast({
        title: isTelugu ? 'పాస్‌వర్డ్ విజయవంతంగా మారింది!' : 'Password Updated Successfully!',
        description: isTelugu
          ? 'మీ కొత్త పాస్‌వర్డ్‌తో లాగిన్ పేజీకి వెళ్తున్నారు...'
          : 'Redirecting to login page with your new password...',
      });

      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      console.error('Password reset failed:', err);
    }
  };

  return (
    <div className="flex items-center justify-center py-10 px-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center space-y-1 bg-primary/5 pb-5 border-b border-primary/10">
          <div className="mx-auto bg-primary/10 text-primary w-12 h-12 rounded-full flex items-center justify-center mb-1">
            <Lock className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-black text-foreground">
            {isTelugu ? 'మొబైల్ పాస్‌వర్డ్ రీసెట్' : 'Phone Password Reset'}
          </CardTitle>
          <CardDescription>
            {isTelugu
              ? 'Gmail అవసరం లేదు. మీ మొబైల్ నంబర్ మరియు OTP ద్వారా కొత్త పాస్‌వర్డ్ పొందండి.'
              : 'No Gmail required. Reset your password directly via your mobile phone OTP.'}
          </CardDescription>
        </CardHeader>

        {/* SMS Simulator Banner */}
        {showSmsBanner && generatedOtp && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-xl shadow-sm space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <MessageSquare className="h-4 w-4 text-amber-600" />
                <span>{isTelugu ? '📩 మీ మొబైల్‌కు వచ్చిన SMS' : '📩 SMS Alert from Animal Bazaar'}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="bg-white text-xs text-amber-900 border-amber-300 hover:bg-amber-100 font-semibold h-7"
                onClick={handleAutoFillOtp}
              >
                {isTelugu ? 'ఆటో-ఫిల్ OTP' : 'Auto-fill'}
              </Button>
            </div>
            <p className="text-xs text-amber-800 leading-snug">
              {isTelugu ? (
                <>
                  పాస్‌వర్డ్ రీసెట్ కొరకు మీ OTP కోడ్:{' '}
                  <strong className="text-base text-amber-950 font-mono tracking-widest px-1.5 py-0.5 bg-white rounded border border-amber-300">
                    {generatedOtp}
                  </strong>
                  . ఇది 10 నిమిషాలు పనిచేస్తుంది.
                </>
              ) : (
                <>
                  Password reset verification OTP is:{' '}
                  <strong className="text-base text-amber-950 font-mono tracking-widest px-1.5 py-0.5 bg-white rounded border border-amber-300">
                    {generatedOtp}
                  </strong>
                </>
              )}
            </p>
          </div>
        )}

        <form onSubmit={handleResetPassword}>
          <CardContent className="grid gap-4 pt-5">
            {/* Step 1: Phone input and OTP Send */}
            <div className="p-3.5 bg-muted/40 border border-primary/20 rounded-xl space-y-3">
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phone" className="font-semibold text-sm flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-primary" />
                    {isTelugu ? 'మొబైల్ నంబర్ (Phone Number)' : 'Mobile Phone Number'} *
                  </Label>
                  {isPhoneVerified && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {isTelugu ? 'ధ్రువీకరించబడింది ✓' : 'Verified ✓'}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98480 12345"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (isPhoneVerified) {
                        setIsPhoneVerified(false);
                        setOtpSent(false);
                      }
                    }}
                    required
                    disabled={isPhoneVerified}
                    className="h-10 text-base font-medium flex-1"
                  />
                  {!isPhoneVerified ? (
                    <Button
                      type="button"
                      className="h-10 px-4 font-semibold shrink-0"
                      onClick={handleSendOtp}
                      disabled={countdown > 0}
                    >
                      {countdown > 0
                        ? `${countdown}s`
                        : otpSent
                        ? (isTelugu ? 'మళ్ళీ పంపండి' : 'Resend')
                        : (isTelugu ? 'OTP పంపండి' : 'Send OTP')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs shrink-0"
                      onClick={() => {
                        setIsPhoneVerified(false);
                        setOtpSent(false);
                      }}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      {isTelugu ? 'మార్చు' : 'Change'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Step 2: OTP Verification */}
              {otpSent && !isPhoneVerified && (
                <div className="space-y-2 pt-2 border-t border-dashed border-primary/20">
                  <Label htmlFor="otp" className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    {isTelugu
                      ? 'మొబైల్‌కు వచ్చిన 6 అంకెల OTP నమోదు చేయండి:'
                      : 'Enter 6-digit OTP code:'}
                  </Label>

                  <div className="flex gap-2">
                    <Input
                      id="otp"
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 629143"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                      className="h-10 font-mono text-center tracking-widest text-lg font-bold"
                    />
                    <Button
                      type="button"
                      className="h-10 px-4 font-bold bg-emerald-700 hover:bg-emerald-800 text-white shrink-0"
                      onClick={handleVerifyOtp}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      {isTelugu ? 'ధ్రువీకరించు' : 'Verify'}
                    </Button>
                  </div>

                  {otpError && (
                    <p className="text-xs text-destructive font-semibold flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {otpError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Enter New Password (Enabled only after OTP verification) */}
            <div className={`space-y-3 transition-opacity ${isPhoneVerified ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="grid gap-1.5">
                <Label htmlFor="newPassword" className="font-semibold text-sm flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-primary" />
                  {isTelugu ? 'కొత్త పాస్‌వర్డ్ (New Password)' : 'New Password'} *
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="******"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={!isPhoneVerified}
                  required={isPhoneVerified}
                  className="h-10"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="confirmPassword" className="font-semibold text-sm">
                  {isTelugu ? 'పాస్‌వర్డ్ నిర్ధారించండి (Confirm Password)' : 'Confirm Password'} *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="******"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!isPhoneVerified}
                  required={isPhoneVerified}
                  className="h-10"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pb-6">
            <Button
              className={`w-full h-11 text-base font-bold shadow-md transition-all ${
                isPhoneVerified
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed opacity-80'
              }`}
              type="submit"
              disabled={!isPhoneVerified || isResetSuccess}
            >
              {isResetSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2 text-white" />
                  {isTelugu ? 'పాస్‌వర్డ్ మారింది! లాగిన్ పేజీకి...' : 'Password Updated! Redirecting...'}
                </>
              ) : isPhoneVerified ? (
                isTelugu ? 'కొత్త పాస్‌వర్డ్ భద్రపరచు (Save Password)' : 'Update Password'
              ) : (
                isTelugu ? 'ముందుగా మొబైల్ OTP ధ్రువీకరించండి' : 'Verify Mobile OTP First'
              )}
            </Button>

            <div className="text-center text-sm">
              <Link href="/login" className="inline-flex items-center gap-1 text-primary hover:underline font-semibold">
                <ArrowLeft className="w-3.5 h-3.5" />
                {isTelugu ? 'తిరిగి లాగిన్ పేజీకి' : 'Back to Login'}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
