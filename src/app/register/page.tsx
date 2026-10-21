'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { allDistricts, states, locations, State } from '@/lib/definitions';
import {
  CheckCircle2,
  Phone,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Lock,
  User as UserIcon,
  Mail,
  MapPin,
  Home,
  Check
} from 'lucide-react';

export default function RegisterPage() {
  const { registerUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Optional!
  const [phone, setPhone] = useState('');
  const [selectedState, setSelectedState] = useState<State | ''>('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [pincode, setPincode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // OTP Verification State
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation Errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const districts = useMemo(() => {
    if (!selectedState || selectedState === 'all') return allDistricts;
    return locations[selectedState as State] || [];
  }, [selectedState]);

  // Handle Resend Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Clean phone number: remove non-digits
  const cleanPhone = (value: string) => value.replace(/\D/g, '');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digitsOnly = cleanPhone(rawVal).slice(0, 10);
    setPhone(digitsOnly);

    // If user changes phone number after verification, reset verified state
    if (isPhoneVerified) {
      setIsPhoneVerified(false);
      setIsOtpSent(false);
      setEnteredOtp('');
      setOtpCode('');
      toast({
        title: 'Mobile number changed',
        description: 'Please verify your new mobile number with OTP.',
      });
    }

    if (fieldErrors.phone) {
      setFieldErrors((prev) => ({ ...prev, phone: '' }));
    }
  };

  // Generate and Send OTP
  const handleSendOtp = () => {
    const digits = cleanPhone(phone);
    if (digits.length !== 10) {
      setFieldErrors((prev) => ({
        ...prev,
        phone: 'Please enter a valid 10-digit mobile number (10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి)',
      }));
      return;
    }

    setIsSendingOtp(true);
    setOtpError(null);

    // Generate a 6-digit demo OTP
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(generated);
    setIsOtpSent(true);
    setResendTimer(30);
    setIsSendingOtp(false);

    toast({
      title: 'OTP Sent! (OTP పంపబడింది)',
      description: `Your verification OTP is: ${generated}`,
      duration: 10000,
    });
  };

  // Verify OTP
  const handleVerifyOtp = () => {
    if (!enteredOtp || enteredOtp.trim().length !== 6) {
      setOtpError('Please enter the 6-digit OTP code.');
      return;
    }

    if (enteredOtp.trim() === otpCode) {
      setIsPhoneVerified(true);
      setOtpError(null);
      toast({
        title: 'Verified Successfully! (ధృవీకరించబడింది)',
        description: 'Your mobile number is now verified.',
      });
    } else {
      setOtpError('Invalid OTP code. Please enter the correct 6-digit OTP.');
    }
  };

  // Validate all fields
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Full Name is required (పేరు నమోదు చేయడం తప్పనిసరి)';
    }

    const digits = cleanPhone(phone);
    if (!digits || digits.length !== 10) {
      errors.phone = 'Valid 10-digit mobile number is required (10 అంకెల మొబైల్ నంబర్ తప్పనిసరి)';
    } else if (!isPhoneVerified) {
      errors.phone = 'Please verify your mobile number with OTP (మొబైల్ నంబర్ OTP వెరిఫికేషన్ తప్పనిసరి)';
    }

    // Gmail is OPTIONAL! So no error if empty.
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!selectedState) {
      errors.state = 'State selection is required (రాష్ట్రం ఎంచుకోవడం తప్పనిసరి)';
    }

    if (!selectedDistrict) {
      errors.district = 'District selection is required (జిల్లా ఎంచుకోవడం తప్పనిసరి)';
    }

    if (!village.trim()) {
      errors.village = 'Village/Town is required (గ్రామం/పట్టణం పేరు తప్పనిసరి)';
    }

    const pinDigits = cleanPhone(pincode);
    if (!pinDigits || pinDigits.length !== 6) {
      errors.pincode = 'Valid 6-digit Pin Code is required (6 అంకెల పిన్ కోడ్ తప్పనిసరి)';
    }

    if (!password) {
      errors.password = 'Password is required (పాస్‌వర్డ్ తప్పనిసరి)';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm Password is required (పాస్‌వర్డ్ నిర్ధారణ తప్పనిసరి)';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match (పాస్‌వర్డ్‌లు సరిపోలడం లేదు)';
    }

    if (!termsAccepted) {
      errors.terms = 'You must agree to the Terms of Service & Privacy Policy';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all mandatory fields and verify your mobile number via OTP.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedPhone = phone.startsWith('+91') ? phone : `+91 ${phone}`;

      registerUser({
        name,
        phone: formattedPhone,
        email: email.trim(), // Can be empty since optional!
        state: selectedState,
        location: selectedDistrict,
        village,
        pincode,
      });

      toast({
        title: 'Account Created! (ఖాతా సృష్టించబడింది)',
        description: `Welcome to Animal Bazaar, ${name}!`,
      });
    } catch (error) {
      console.error('Error during registration submission:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: 'Failed to create your account. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-8 px-4">
      <Card className="w-full max-w-xl shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold text-primary">
            Create an Account (ఖాతా సృష్టించండి)
          </CardTitle>
          <CardDescription>
            Enter your details below to register. Mobile OTP verification is required.
            <br />
            <span className="text-xs text-muted-foreground font-medium">
              (జిమెయిల్ తప్ప మిగిలిన వివరాలన్నీ తప్పనిసరి - All fields except Gmail are mandatory)
            </span>
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="name" className="flex items-center gap-1.5 font-medium">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  Full Name (పూర్తి పేరు) <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
                }}
                placeholder="e.g. Ramesh Reddy"
                className={fieldErrors.name ? 'border-destructive' : ''}
              />
              {fieldErrors.name && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Mobile Number & OTP Verification Section */}
            <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone" className="flex items-center gap-1.5 font-medium">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Mobile Number (మొబైల్ నంబర్) <span className="text-destructive">*</span>
                </Label>
                {isPhoneVerified ? (
                  <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                    <Check className="h-3 w-3" /> Verified (ధృవీకరించబడింది)
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <ShieldCheck className="h-3 w-3" /> OTP Required
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-medium">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    maxLength={10}
                    value={phone}
                    disabled={isPhoneVerified}
                    onChange={handlePhoneChange}
                    placeholder="98765 43210"
                    className={`pl-12 ${fieldErrors.phone ? 'border-destructive' : ''}`}
                  />
                </div>

                {!isPhoneVerified ? (
                  <Button
                    type="button"
                    variant={isOtpSent ? 'outline' : 'default'}
                    onClick={handleSendOtp}
                    disabled={phone.length !== 10 || isSendingOtp || resendTimer > 0}
                    className="shrink-0"
                  >
                    {isSendingOtp ? (
                      'Sending...'
                    ) : resendTimer > 0 ? (
                      `Resend (${resendTimer}s)`
                    ) : isOtpSent ? (
                      <span className="flex items-center gap-1">
                        <RefreshCw className="h-3.5 w-3.5" /> Resend OTP
                      </span>
                    ) : (
                      'Send OTP (OTP పంపండి)'
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsPhoneVerified(false);
                      setIsOtpSent(false);
                      setEnteredOtp('');
                      setOtpCode('');
                    }}
                  >
                    Change
                  </Button>
                )}
              </div>

              {fieldErrors.phone && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {fieldErrors.phone}
                </p>
              )}

              {/* OTP Prompt Box when OTP has been sent */}
              {isOtpSent && !isPhoneVerified && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  <Alert className="bg-primary/5 border-primary/20 py-2.5">
                    <KeyRound className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-xs font-semibold text-primary">
                      Demo OTP Code: <span className="text-sm font-bold tracking-widest">{otpCode}</span>
                    </AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground">
                      We sent a 6-digit OTP code to +91 {phone}. Enter it below to verify.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => {
                          setEnteredOtp(cleanPhone(e.target.value).slice(0, 6));
                          setOtpError(null);
                        }}
                        placeholder="Enter 6-digit OTP"
                        className={`tracking-widest font-mono text-center text-base ${
                          otpError ? 'border-destructive' : ''
                        }`}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={enteredOtp.length !== 6}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Verify OTP
                    </Button>
                  </div>

                  {otpError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {otpError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Gmail (Explicitly OPTIONAL per user request) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="email" className="flex items-center gap-1.5 font-medium">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Gmail / Email (జిమెయిల్)
                </Label>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Optional (ఐచ్ఛికం)
                </span>
              </div>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
                }}
                placeholder="yourname@gmail.com (Optional)"
                className={fieldErrors.email ? 'border-destructive' : ''}
              />
              {fieldErrors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* State and District (Required) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="postState" className="flex items-center gap-1 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  State (రాష్ట్రం) <span className="text-destructive">*</span>
                </Label>
                <Select
                  name="state"
                  value={selectedState}
                  onValueChange={(value) => {
                    setSelectedState(value as State);
                    setSelectedDistrict('');
                    if (fieldErrors.state) setFieldErrors((p) => ({ ...p, state: '' }));
                  }}
                >
                  <SelectTrigger
                    id="postState"
                    className={fieldErrors.state ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {states.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.state && (
                  <p className="text-xs text-destructive">{fieldErrors.state}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="postLocation" className="flex items-center gap-1 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  District (జిల్లా) <span className="text-destructive">*</span>
                </Label>
                <Select
                  name="location"
                  value={selectedDistrict}
                  disabled={!selectedState}
                  onValueChange={(val) => {
                    setSelectedDistrict(val);
                    if (fieldErrors.district) setFieldErrors((p) => ({ ...p, district: '' }));
                  }}
                >
                  <SelectTrigger
                    id="postLocation"
                    className={fieldErrors.district ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder={selectedState ? 'Select District' : 'Select State first'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {districts.map((district, index) => (
                      <SelectItem key={`${district}-${index}`} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.district && (
                  <p className="text-xs text-destructive">{fieldErrors.district}</p>
                )}
              </div>
            </div>

            {/* Village/Town and Pin Code (Required) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="village" className="flex items-center gap-1 font-medium">
                  <Home className="h-3.5 w-3.5 text-muted-foreground" />
                  Village / Town (గ్రామం / పట్టణం) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="village"
                  value={village}
                  onChange={(e) => {
                    setVillage(e.target.value);
                    if (fieldErrors.village) setFieldErrors((p) => ({ ...p, village: '' }));
                  }}
                  placeholder="e.g. Rampur / Ameerpet"
                  className={fieldErrors.village ? 'border-destructive' : ''}
                />
                {fieldErrors.village && (
                  <p className="text-xs text-destructive">{fieldErrors.village}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pincode" className="flex items-center gap-1 font-medium">
                  Pin Code (పిన్ కోడ్) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pincode"
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    setPincode(cleanPhone(e.target.value).slice(0, 6));
                    if (fieldErrors.pincode) setFieldErrors((p) => ({ ...p, pincode: '' }));
                  }}
                  placeholder="e.g. 500001"
                  className={fieldErrors.pincode ? 'border-destructive' : ''}
                />
                {fieldErrors.pincode && (
                  <p className="text-xs text-destructive">{fieldErrors.pincode}</p>
                )}
              </div>
            </div>

            {/* Password and Confirm Password (Required) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="flex items-center gap-1 font-medium">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Password (పాస్‌వర్డ్) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' }));
                  }}
                  placeholder="Min 6 characters"
                  className={fieldErrors.password ? 'border-destructive' : ''}
                />
                {fieldErrors.password && (
                  <p className="text-xs text-destructive">{fieldErrors.password}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="flex items-center gap-1 font-medium">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Confirm Password (నిర్ధారించండి) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: '' }));
                  }}
                  placeholder="Repeat password"
                  className={fieldErrors.confirmPassword ? 'border-destructive' : ''}
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="pt-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => {
                    setTermsAccepted(Boolean(checked));
                    if (fieldErrors.terms) setFieldErrors((p) => ({ ...p, terms: '' }));
                  }}
                  className="mt-1"
                />
                <Label
                  htmlFor="terms"
                  className="text-xs leading-relaxed text-muted-foreground font-normal cursor-pointer select-none"
                >
                  I agree to the{' '}
                  <Link href="/terms" className="underline underline-offset-4 hover:text-primary font-medium text-foreground">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="underline underline-offset-4 hover:text-primary font-medium text-foreground">
                    Privacy Policy
                  </Link>
                  . (నిబంధనలు మరియు గోప్యతా విధానాన్ని అంగీకరిస్తున్నాను){' '}
                  <span className="text-destructive">*</span>
                </Label>
              </div>
              {fieldErrors.terms && (
                <p className="text-xs text-destructive mt-1">{fieldErrors.terms}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              className="w-full text-base font-semibold py-5"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Creating Account...'
              ) : !isPhoneVerified ? (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Verify Mobile & Create Account
                </span>
              ) : (
                'Create Account (ఖాతా సృష్టించండి)'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="underline text-primary font-medium">
                Sign in (లాగిన్ అవ్వండి)
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
