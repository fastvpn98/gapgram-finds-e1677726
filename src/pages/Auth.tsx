import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MessageCircle, Mail, Lock, Eye, EyeOff, Chrome, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  
  // OTP States
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast({
          title: "خطا در ورود با گوگل",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "خطا",
        description: "مشکلی در اتصال به گوگل پیش آمد.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Sign In - Send Code
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(otpEmail)) {
      toast({
        title: "خطا",
        description: "لطفاً یک ایمیل معتبر وارد کنید.",
        variant: "destructive",
      });
      return;
    }

    setOtpLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({
      email: otpEmail,
      options: {
        shouldCreateUser: true,
      }
    });

    setOtpLoading(false);

    if (error) {
      toast({
        title: "خطا در ارسال کد",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setOtpSent(true);
      toast({
        title: "کد ارسال شد",
        description: "لینک ورود به ایمیل شما ارسال شد. لطفاً ایمیل خود را بررسی کنید.",
      });
    }
  };

  // OTP Verify Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      toast({
        title: "خطا",
        description: "لطفاً کد ۶ رقمی را کامل وارد کنید.",
        variant: "destructive",
      });
      return;
    }

    setOtpLoading(true);
    
    const { error } = await supabase.auth.verifyOtp({
      email: otpEmail,
      token: otpCode,
      type: "email",
    });

    setOtpLoading(false);

    if (error) {
      toast({
        title: "کد نادرست",
        description: "کد وارد شده صحیح نیست یا منقضی شده است.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "ورود موفق",
        description: "خوش آمدید!",
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(forgotEmail)) {
      toast({
        title: "خطا",
        description: "لطفاً یک ایمیل معتبر وارد کنید.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "ایمیل ارسال شد",
        description: "لینک بازیابی رمز عبور به ایمیل شما ارسال شد. لطفاً ایمیل خود را بررسی کنید.",
      });
      setShowForgotPassword(false);
      setForgotEmail("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast({
        title: "خطا",
        description: "لطفاً یک ایمیل معتبر وارد کنید.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "خطا",
        description: "رمز عبور باید حداقل ۶ کاراکتر باشد.",
        variant: "destructive",
      });
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      toast({
        title: "خطا",
        description: "رمز عبور و تکرار آن مطابقت ندارند.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      setIsLoading(false);
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "خطا",
            description: "این ایمیل قبلاً ثبت شده است. لطفاً وارد شوید.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "خطا در ثبت‌نام",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "ثبت‌نام موفق",
          description: "لینک تأیید به ایمیل شما ارسال شد. لطفاً ایمیل خود را بررسی کنید.",
        });
      }
    } else {
      const { error } = await signIn(email, password);
      setIsLoading(false);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "خطا",
            description: "ایمیل یا رمز عبور اشتباه است.",
            variant: "destructive",
          });
        } else if (error.message.includes("Email not confirmed")) {
          toast({
            title: "ایمیل تأیید نشده",
            description: "لطفاً ابتدا ایمیل خود را تأیید کنید.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "خطا در ورود",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    }
  };

  // Forgot Password Form
  if (showForgotPassword) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <Mail className="h-9 w-9 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">فراموشی رمز عبور</CardTitle>
              <CardDescription className="text-base">
                ایمیل خود را وارد کنید تا لینک بازیابی برایتان ارسال شود
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleForgotPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgotEmail">ایمیل</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgotEmail"
                    type="email"
                    placeholder="example@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pr-10 text-left"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                    در حال ارسال...
                  </>
                ) : (
                  "ارسال لینک بازیابی"
                )}
              </Button>
            </CardContent>
          </form>

          <CardFooter>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowForgotPassword(false)}
            >
              بازگشت به صفحه ورود
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <MessageCircle className="h-9 w-9 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              {isSignUp ? "ثبت‌نام در گپ‌گرام" : "ورود به گپ‌گرام"}
            </CardTitle>
            <CardDescription className="text-base">
              روش ورود خود را انتخاب کنید
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Sign In Button */}
          <Button
            variant="outline"
            className="w-full h-12 text-base font-medium gap-3"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Chrome className="h-5 w-5" />
            )}
            ورود با حساب گوگل
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">یا</span>
            </div>
          </div>

          {/* Tabs for Password / OTP */}
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password" className="gap-2">
                <Lock className="h-4 w-4" />
                رمز عبور
              </TabsTrigger>
              <TabsTrigger value="otp" className="gap-2">
                <KeyRound className="h-4 w-4" />
                کد یکبار مصرف
              </TabsTrigger>
            </TabsList>

            {/* Password Tab */}
            <TabsContent value="password" className="space-y-4 mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">ایمیل</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10 text-left"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">رمز عبور</Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        فراموشی رمز عبور؟
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 pl-10 text-left"
                      dir="ltr"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10 text-left"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>
                )}

                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin ml-2" />
                      {isSignUp ? "در حال ثبت‌نام..." : "در حال ورود..."}
                    </>
                  ) : (
                    isSignUp ? "ثبت‌نام" : "ورود"
                  )}
                </Button>
              </form>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setPassword("");
                  setConfirmPassword("");
                }}
              >
                {isSignUp ? "قبلاً ثبت‌نام کرده‌اید؟ ورود" : "حساب ندارید؟ ثبت‌نام کنید"}
              </Button>
            </TabsContent>

            {/* OTP Tab */}
            <TabsContent value="otp" className="space-y-4 mt-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otpEmail">ایمیل</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="otpEmail"
                        type="email"
                        placeholder="example@email.com"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        className="pr-10 text-left"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground text-center">
                    یک لینک ورود به ایمیل شما ارسال خواهد شد
                  </p>

                  <Button 
                    type="submit"
                    disabled={otpLoading}
                    className="w-full h-12 text-base font-medium"
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin ml-2" />
                        در حال ارسال...
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5 ml-2" />
                        ارسال لینک ورود
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      کد ارسال شده به
                    </p>
                    <p className="font-medium" dir="ltr">{otpEmail}</p>
                  </div>

                  <div className="flex justify-center" dir="ltr">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(value) => setOtpCode(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button 
                    type="submit"
                    disabled={otpLoading || otpCode.length !== 6}
                    className="w-full h-12 text-base font-medium"
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin ml-2" />
                        در حال تأیید...
                      </>
                    ) : (
                      "تأیید و ورود"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                  >
                    ارسال مجدد کد
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            با ورود، شرایط استفاده از گپ‌گرام را می‌پذیرید.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
