import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MessageCircle, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
          description: "حساب شما ایجاد شد. خوش آمدید!",
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
              {isSignUp 
                ? "برای ثبت آگهی یک حساب کاربری بسازید" 
                : "برای ثبت و مدیریت آگهی‌های خود وارد شوید"}
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
              <Label htmlFor="password">رمز عبور</Label>
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
          </CardContent>
        </form>

        <CardFooter className="flex flex-col gap-4 text-center">
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
          <p className="text-sm text-muted-foreground">
            با ورود، شرایط استفاده از گپ‌گرام را می‌پذیرید.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
