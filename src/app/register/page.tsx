'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { State } from '@/lib/definitions';
import {
  verifyIndianPinCode,
  detectVerifiedGpsLocation,
  type PostalOfficeItem,
} from '@/lib/address-verifier';
import { VERIFIED_LOCATION_STORAGE_KEY } from '@/components/permissions-onboarding';
import { useToast } from '@/hooks/use-toast';
import {
  UserPlus,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  KeyRound,
  MessageSquare,
  Lock,
  MapPin,
  Navigation,
  Loader2,
} from 'lucide-react';

export default function RegisterPage() {
  const { register, language } = useAuth();
  const { toast } = useToast();
  const isTelugu = language === 'te';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verified Address State (No Fake Addresses Allowed)
  const [pincode, setPincode] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifiedState, setVerifiedState] = useState<State | ''>('');
  const [verifiedDistrict, setVerifiedDistrict] = useState('');
  const [postOffices, setPostOffices] = useState<PostalOfficeItem[]>([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [showSmsBanner, setShowSmsBanner] = useState(false);

  // Handle Resend Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handlePinLookup = async (pinToVerify: string, preferredVillage?: string) => {
    const clean = pinToVerify.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);

    if (clean.length < 6) {
      setIsPinVerified(false);
      setPostOffices([]);
      setSelectedVillage('');
      setVerifiedState('');
      setVerifiedDistrict('');
      setPinError(null);
      return;
    }

    setIsVerifyingPin(true);
    setPinError(null);
    const result = await verifyIndianPinCode(clean);
    setIsVerifyingPin(false);

    if (!result.isValid) {
      setIsPinVerified(false);
      setPostOffices([]);
      setSelectedVillage('');
      setVerifiedState('');
      setVerifiedDistrict('');
      setPinError(isTelugu ? result.errorTe || 'తప్పు పిన్ కోడ్' : result.errorEn || 'Invalid Pin Code');
      return;
    }

    setIsPinVerified(true);
    setVerifiedState(result.state);
    setVerifiedDistrict(result.district);
    setPostOffices(result.postOffices);

    const matchedOffice =
      preferredVillage &&
      result.postOffices.find((po) => po.Name.toLowerCase() === preferredVillage.toLowerCase());
    setSelectedVillage(matchedOffice ? matchedOffice.Name : result.postOffices[0]?.Name || '');
  };

  const handleUseGpsLocation = async () => {
    setIsDetectingGps(true);
    setPinError(null);
    const gps = await detectVerifiedGpsLocation();
    setIsDetectingGps(false);

    if (!gps.success) {
      setPinError(isTelugu ? gps.errorTe || 'GPS విఫలమైంది' : gps.errorEn || 'GPS failed');
      toast({
        variant: 'destructive',
        title: isTelugu ? 'GPS లొకేషన్ లోపం' : 'GPS Location Error',
        description: isTelugu ? gps.errorTe : gps.errorEn,
      });
      return;
    }

    if (gps.pincode) {
      setPincode(gps.pincode);
    }
    if (gps.state) {
      setVerifiedState(gps.state);
    }
    if (gps.district) {
      setVerifiedDistrict(gps.district);
    }
    if (gps.postOffices && gps.postOffices.length > 0) {
      setPostOffices(gps.postOffices);
      setSelectedVillage(gps.village || gps.postOffices[0].Name);
      setIsPinVerified(true);
    } else if (gps.village && gps.district) {
      const syntheticOffice: PostalOfficeItem = {
        Name: gps.village,
        Block: gps.district,
        District: gps.district,
        State: gps.state || 'Telangana',
        Pincode: gps.pincode || '500001',
      };
      setPostOffices([syntheticOffice]);
      setSelectedVillage(gps.village);
      setIsPinVerified(true);
    }

    toast({
      title: isTelugu ? 'GPS చిరునామా ధ్రువీకరించబడింది ✓' : 'GPS Address Verified ✓',
      description: `${gps.village || ''}, ${gps.district || ''} (${gps.pincode || ''})`,
    });
  };

  // Pre-fill verified location if already captured during onboarding
  useEffect(() => {
    try {
      const cached = localStorage.getItem(VERIFIED_LOCATION_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.pincode && /^[1-9][0-9]{5}$/.test(parsed.pincode)) {
          handlePinLookup(parsed.pincode, parsed.village);
        }
      }
    } catch (e) {
      console.error('Error loading cached location:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When phone number changes after being verified, reset verification
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (isPhoneVerified && val !== verifiedPhone) {
      setIsPhoneVerified(false);
      setOtpSent(false);
      setGeneratedOtp(null);
      setOtpValue('');
      setShowSmsBanner(false);
    }
  };

  const handleSendOtp = () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'చెల్లుబాటు అయ్యే ఫోన్ నంబర్ ఇవ్వండి' : 'Valid Phone Required',
        description: isTelugu
          ? 'దయచేసి 10 అంకెల సరైన మొబైల్ నంబర్ నమోదు చేయండి.'
          : 'Please enter a valid 10-digit mobile phone number.',
      });
      return;
    }

    // Generate 6-digit OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpSent(true);
    setOtpError(null);
    setCountdown(30);
    setShowSmsBanner(true);

    toast({
      title: isTelugu ? 'OTP పంపబడింది!' : 'OTP Sent Successfully!',
      description: isTelugu
        ? `మీ మొబైల్ ${cleanPhone} కు 6 అంకెల OTP పంపబడింది.`
        : `6-digit verification OTP has been sent to ${cleanPhone}.`,
    });
  };

  const handleVerifyOtp = () => {
    if (!otpValue || otpValue.trim() !== generatedOtp) {
      setOtpError(
        isTelugu
          ? 'మీరు నమోదు చేసిన OTP సరైనది కాదు. దయచేసి మళ్ళీ సరిచూసుకోండి.'
          : 'Invalid OTP code. Please check and try again.'
      );
      toast({
        variant: 'destructive',
        title: isTelugu ? 'తప్పు OTP' : 'Incorrect OTP',
        description: isTelugu ? 'దయచేసి సరైన OTP నమోదు చేయండి.' : 'Please enter the correct 6-digit OTP.',
      });
      return;
    }

    setIsPhoneVerified(true);
    setVerifiedPhone(phone.trim());
    setOtpError(null);
    setShowSmsBanner(false);

    toast({
      title: isTelugu ? 'మొబైల్ ధ్రువీకరణ పూర్తయింది!' : 'Phone Number Verified!',
      description: isTelugu
        ? 'మీ మొబైల్ నంబర్ విజయవంతంగా ధ్రువీకరించబడింది. ఇప్పుడు రిజిస్ట్రేషన్ పూర్తి చేయవచ్చు.'
        : 'Your phone number is verified. You can now complete registration.',
    });
  };

  const handleAutoFillOtp = () => {
    if (generatedOtp) {
      setOtpValue(generatedOtp);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPhoneVerified) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'మొబైల్ OTP ధ్రువీకరణ తప్పనిసరి' : 'Phone Verification Required',
        description: isTelugu
          ? 'రిజిస్ట్రేషన్ పూర్తి చేయడానికి ముందుగా మీ మొబైల్ నంబర్‌కు వచ్చిన OTP ధ్రువీకరించండి.'
          : 'Please verify your phone number via OTP before submitting registration.',
      });
      return;
    }

    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'పేరు అవసరం' : 'Name Required',
        description: isTelugu ? 'దయచేసి మీ పూర్తి పేరు నమోదు చేయండి' : 'Please enter your full name.',
      });
      return;
    }

    if (!isPinVerified || !verifiedDistrict || !selectedVillage) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'నిజమైన చిరునామా ధ్రువీకరణ తప్పనిసరి' : 'Verified Address Required',
        description: isTelugu
          ? 'నకిలీ చిరునామా అనుమతించబడదు. దయచేసి సరైన 6 అంకెల పిన్ కోడ్ లేదా GPS ద్వారా మీ గ్రామాన్ని ఎంచుకోండి.'
          : 'Fake addresses are not allowed. Please verify your real 6-digit Pin Code or GPS location.',
      });
      return;
    }

    if (!agreed) {
      toast({
        variant: 'destructive',
        title: isTelugu ? 'నిబంధనలు అంగీకరించండి' : 'Terms Required',
        description: isTelugu ? 'దయచేసి నిబంధనలను అంగీకరించండి' : 'Please agree to terms of service.',
      });
      return;
    }

    setIsSubmitting(true);
    register({
      name,
      phone: verifiedPhone || phone.trim(),
      email: email || `${phone.replace(/\D/g, '')}@animalbazaar.in`,
      state: verifiedState || 'Telangana',
      district: verifiedDistrict,
      village: selectedVillage,
      pincode,
      password,
    });
    setIsSubmitting(false);

    toast({
      title: isTelugu ? 'ఖాతా విజయవంతంగా సృష్టించబడింది!' : 'Account Created Successfully!',
      description: isTelugu ? `స్వాగతం ${name} గారు!` : `Welcome to Animal Bazaar, ${name}!`,
    });
  };

  return (
    <div className="flex items-center justify-center py-6 px-4">
      <Card className="w-full max-w-lg shadow-xl border-primary/25">
        <CardHeader className="text-center space-y-1 bg-primary/5 pb-5 border-b border-primary/10">
          <div className="mx-auto bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mb-1 shadow-md">
            <UserPlus className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-black text-foreground">
            {isTelugu ? 'రైతు / వ్యాపారి నమోదు (Register)' : 'Farmer / Trader Registration'}
          </CardTitle>
          <CardDescription>
            {isTelugu
              ? 'మొబైల్ OTP ధ్రువీకరణతో సురక్షితమైన రైతు ఖాతాను సృష్టించండి'
              : 'Create your verified account with instant mobile OTP verification.'}
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
                size="sm"
                className="bg-white text-xs text-amber-900 border-amber-300 hover:bg-amber-100 font-semibold h-7"
                onClick={handleAutoFillOtp}
              >
                {isTelugu ? 'ఆటో-ఫిల్ OTP' : 'Auto-fill'}
              </Button>
            </div>
            <p className="text-xs text-amber-800 leading-snug">
              {isTelugu ? (
                <>
                  మీ Animal Bazaar ఖాతా నమోదు కొరకు ధ్రువీకరణ OTP:{' '}
                  <strong className="text-base text-amber-950 font-mono tracking-widest px-1.5 py-0.5 bg-white rounded border border-amber-300">
                    {generatedOtp}
                  </strong>
                  . ఇది 10 నిమిషాలు పనిచేస్తుంది.
                </>
              ) : (
                <>
                  Your Animal Bazaar verification OTP is:{' '}
                  <strong className="text-base text-amber-950 font-mono tracking-widest px-1.5 py-0.5 bg-white rounded border border-amber-300">
                    {generatedOtp}
                  </strong>
                  . Valid for 10 minutes.
                </>
              )}
            </p>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <CardContent className="grid gap-4 pt-5">
            {/* Full Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="name" className="font-semibold text-sm">
                {isTelugu ? 'పూర్తి పేరు (Full Name)' : 'Full Name'} *
              </Label>
              <Input
                id="name"
                placeholder={isTelugu ? 'ఉదాహరణ: కె. వెంకటేశ్వర్లు' : 'e.g. K. Venkateshwarlu'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10 text-base"
              />
            </div>

            {/* Phone Number & OTP Verification Section */}
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
                    onChange={handlePhoneChange}
                    required
                    disabled={isPhoneVerified}
                    className={`h-10 text-base font-medium flex-1 ${
                      isPhoneVerified ? 'border-emerald-500 bg-emerald-50/50' : ''
                    }`}
                  />
                  {!isPhoneVerified ? (
                    <Button
                      type="button"
                      variant="default"
                      className="h-10 px-4 font-semibold shrink-0"
                      onClick={handleSendOtp}
                      disabled={countdown > 0}
                    >
                      {countdown > 0
                        ? `${countdown}s`
                        : otpSent
                        ? (isTelugu ? 'మళ్ళీ పంపండి' : 'Resend')
                        : (isTelugu ? 'OTP పంపండి' : 'Get OTP')}
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

              {/* OTP Input and Verification Trigger */}
              {otpSent && !isPhoneVerified && (
                <div className="space-y-2 pt-1 border-t border-dashed border-primary/20">
                  <Label htmlFor="otp" className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    {isTelugu
                      ? 'మొబైల్‌కు వచ్చిన 6 అంకెల OTP నమోదు చేయండి:'
                      : 'Enter 6-digit OTP received on mobile:'}
                  </Label>

                  <div className="flex gap-2">
                    <Input
                      id="otp"
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 583921"
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
                      {isTelugu ? 'ధ్రువీకరించు' : 'Verify OTP'}
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

              {!isPhoneVerified && (
                <p className="text-xs text-amber-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isTelugu
                    ? 'గమనిక: మొబైల్ OTP ధ్రువీకరణ పూర్తయితేనే రిజిస్ట్రేషన్ సాధ్యమవుతుంది.'
                    : 'Note: OTP verification is mandatory to complete registration.'}
                </p>
              )}
            </div>

            {/* Email (Optional) */}
            <div className="grid gap-1.5">
              <Label htmlFor="email" className="font-semibold text-sm">
                {isTelugu ? 'ఈమెయిల్ (Email - Optional)' : 'Email (Optional)'}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="farmer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Verified Pin Code / GPS Real Address Section (No Fake Address Allowed) */}
            <div className="p-3.5 bg-muted/40 border border-primary/20 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label className="font-semibold text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    {isTelugu ? 'నిజమైన చిరునామా (Pin Code / GPS) *' : 'Verified Address (Pin Code / GPS) *'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isTelugu
                      ? 'నకిలీ చిరునామాలు అనుమతించబడవు. పిన్ కోడ్ లేదా GPS ఉపయోగించండి.'
                      : 'Fake addresses are blocked. Verify via 6-digit Pin Code or GPS.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseGpsLocation}
                  disabled={isDetectingGps}
                  className="shrink-0 h-8 text-xs"
                >
                  {isDetectingGps ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-primary" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5 mr-1 text-primary" />
                  )}
                  {isTelugu ? 'GPS తీసుకోండి' : 'Use GPS'}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="pincode" className="font-semibold text-xs">
                    {isTelugu ? '6-అంకెల పిన్ కోడ్ (Pin Code)' : '6-Digit Pin Code'} *
                  </Label>
                  <div className="relative">
                    <Input
                      id="pincode"
                      type="text"
                      maxLength={6}
                      placeholder="ఉదా: 500001, 522001"
                      value={pincode}
                      onChange={(e) => handlePinLookup(e.target.value)}
                      required
                      className={`h-10 font-mono tabular-nums ${
                        isPinVerified ? 'border-emerald-500 bg-emerald-50/40' : ''
                      }`}
                    />
                    {isVerifyingPin && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary absolute right-3 top-3" />
                    )}
                  </div>
                  {pinError && <p className="text-xs text-destructive font-semibold">{pinError}</p>}
                  {isPinVerified && (
                    <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isTelugu ? 'పిన్ కోడ్ ధ్రువీకరించబడింది' : 'Verified Pin Code'}
                    </p>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="village" className="font-semibold text-xs">
                    {isTelugu ? 'గ్రామం / పోస్టాఫీసు (Verified Village)' : 'Verified Village'} *
                  </Label>
                  <Select
                    value={selectedVillage}
                    onValueChange={setSelectedVillage}
                    disabled={!isPinVerified || postOffices.length === 0}
                    required
                  >
                    <SelectTrigger id="village" className="h-10">
                      <SelectValue
                        placeholder={
                          isPinVerified
                            ? isTelugu
                              ? 'గ్రామాన్ని ఎంచుకోండి'
                              : 'Select Village'
                            : isTelugu
                            ? 'ముందుగా పిన్ కోడ్ ఇవ్వండి'
                            : 'Enter Pin Code first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {postOffices.map((po, idx) => (
                        <SelectItem key={`${po.Name}-${idx}`} value={po.Name}>
                          {po.Name} {po.Block ? `(${po.Block})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">
                    {isTelugu ? 'జిల్లా (Verified District)' : 'Verified District'}
                  </Label>
                  <Input
                    value={verifiedDistrict}
                    readOnly
                    disabled
                    placeholder={isTelugu ? 'ఆటోమేటిక్‌గా వస్తుంది' : 'Auto-filled'}
                    className="h-9 bg-muted font-semibold"
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">
                    {isTelugu ? 'రాష్ట్రం (Verified State)' : 'Verified State'}
                  </Label>
                  <Input
                    value={verifiedState}
                    readOnly
                    disabled
                    placeholder={isTelugu ? 'ఆటోమేటిక్‌గా వస్తుంది' : 'Auto-filled'}
                    className="h-9 bg-muted font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="grid gap-1.5">
              <Label htmlFor="password" className="font-semibold text-sm flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-primary" />
                {isTelugu ? 'పాస్‌వర్డ్ (Password)' : 'Password'} *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10"
              />
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start space-x-2 pt-1">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(!!checked)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-xs font-normal text-muted-foreground leading-snug cursor-pointer">
                {isTelugu ? (
                  <>
                    నేను పశువుల బజార్{' '}
                    <Link href="/terms" className="underline hover:text-primary">
                      నిబంధనలు
                    </Link>{' '}
                    మరియు{' '}
                    <Link href="/privacy" className="underline hover:text-primary">
                      గోప్యతా విధానాన్ని
                    </Link>{' '}
                    అంగీకరిస్తున్నాను.
                  </>
                ) : (
                  <>
                    I agree to the{' '}
                    <Link href="/terms" className="underline hover:text-primary">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="underline hover:text-primary">
                      Privacy Policy
                    </Link>
                    .
                  </>
                )}
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pb-6">
            <Button
              className={`w-full h-11 text-base font-bold shadow-md transition-all ${
                isPhoneVerified && isPinVerified && selectedVillage
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed opacity-80'
              }`}
              type="submit"
              disabled={!isPhoneVerified || !isPinVerified || !selectedVillage || isSubmitting}
            >
              {isSubmitting ? (
                isTelugu ? 'ఖాతా తెరవబడుతోంది...' : 'Creating account...'
              ) : !isPhoneVerified ? (
                isTelugu ? 'ముందుగా మొబైల్ OTP ధ్రువీకరించండి' : 'Verify Mobile OTP First'
              ) : !isPinVerified || !selectedVillage ? (
                isTelugu ? 'సరైన పిన్ కోడ్ / చిరునామా ధ్రువీకరించండి' : 'Verify Pin Code / Address'
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  {isTelugu ? 'రైతు ఖాతా నమోదు చేయండి' : 'Complete Registration'}
                </>
              )}
            </Button>

            <div className="text-center text-sm">
              {isTelugu ? 'ఇప్పటికే ఖాతా ఉందా?' : 'Already have an account?'}{' '}
              <Link href="/login" className="font-semibold underline text-primary">
                {isTelugu ? 'లాగిన్ చేయండి (Sign in)' : 'Sign in'}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
