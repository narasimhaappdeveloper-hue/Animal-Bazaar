'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { useState } from 'react';
import { Lock, Phone, UserCheck, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { login, language } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTelugu = language === 'te';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'ఫోన్ నంబర్ అవసరం' : 'Phone Required',
        description: isTelugu ? 'దయచేసి మీ మొబైల్ నంబర్ నమోదు చేయండి' : 'Please enter your mobile phone number.',
      });
      return;
    }

    setIsSubmitting(true);
    const success = login(phone, password);
    setIsSubmitting(false);

    if (success) {
      toast({
        title: isTelugu ? 'లాగిన్ విజయవంతమైంది!' : 'Welcome Back!',
        description: isTelugu ? 'పశువుల బజార్‌లోకి స్వాగతం' : 'Logged into your Animal Bazaar account.',
      });
    }
  };

  const handleQuickLoginFarmer = () => {
    setPhone('+91 98480 12345');
    setPassword('kisan123');
    login('+91 98480 12345', 'kisan123', 'వెంకట్ రెడ్డి (Venkat Reddy)');
    toast({
      title: isTelugu ? 'రైతు ఖాతాలోకి లాగిన్ అయ్యారు' : 'Logged in as Farmer',
      description: isTelugu ? 'స్వాగతం వెంకట్ రెడ్డి గారు' : 'Welcome Venkat Reddy',
    });
  };

  return (
    <div className="flex items-center justify-center py-8 px-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 text-primary w-12 h-12 rounded-full flex items-center justify-center mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isTelugu ? 'ఖాతాలోకి లాగిన్ అవ్వండి' : 'Sign in to Account'}
          </CardTitle>
          <CardDescription>
            {isTelugu
              ? 'మీ పశువులను అమ్మడానికి లేదా కొనడానికి మీ మొబైల్ నంబర్‌తో లాగిన్ చేయండి.'
              : 'Enter your phone number to access your marketplace listings and buy/sell.'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone" className="font-semibold flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-primary" />
                {isTelugu ? 'మొబైల్ నంబర్ (Phone Number)' : 'Mobile Phone Number'}
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-11 text-base"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-semibold flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-primary" />
                  {isTelugu ? 'పాస్‌వర్డ్ (Password)' : 'Password'}
                </Label>
                <Link href="/forgot-password" className="text-xs underline text-primary">
                  {isTelugu ? 'పాస్‌వర్డ్ మర్చిపోయారా?' : 'Forgot password?'}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder={isTelugu ? 'మీ పాస్‌వర్డ్ నమోదు చేయండి' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 text-base"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full h-11 text-base font-semibold" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isTelugu ? 'లాగిన్ అవుతోంది...' : 'Signing in...') : (isTelugu ? 'లాగిన్ అవ్వండి' : 'Sign In')}
            </Button>

            <div className="p-3 bg-muted/60 rounded-lg text-xs text-muted-foreground w-full flex items-center justify-between">
              <span>{isTelugu ? 'తక్షణ రైతు లాగిన్ (త్వరిత పరీక్ష కొరకు):' : 'Instant Farmer Login (Quick test):'}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-white"
                onClick={handleQuickLoginFarmer}
              >
                <UserCheck className="w-3.5 h-3.5 mr-1 text-primary" />
                {isTelugu ? 'రైతుగా లాగిన్' : 'Farmer Login'}
              </Button>
            </div>

            <div className="mt-2 text-center text-sm">
              {isTelugu ? 'ఇంకా ఖాతా లేదా?' : "Don't have an account yet?"}{' '}
              <Link href="/register" className="font-semibold underline text-primary">
                {isTelugu ? 'కొత్త ఖాతా తెరవండి (Register)' : 'Create account'}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
