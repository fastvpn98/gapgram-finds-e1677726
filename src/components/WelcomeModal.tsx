import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageCircle, Sparkles, Users } from "lucide-react";

interface WelcomeModalProps {
  onEnter: () => void;
}

export function WelcomeModal({ onEnter }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen the welcome modal
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setOpen(true);
    }
  }, []);

  const handleEnter = () => {
    sessionStorage.setItem("hasSeenWelcome", "true");
    setOpen(false);
    onEnter();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md text-center" dir="rtl">
        <DialogHeader className="space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-lg">
            <MessageCircle className="h-10 w-10 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            به گپ‌گرام خوش آمدید! 
            <Sparkles className="inline-block h-5 w-5 mr-2 text-yellow-500" />
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            بزرگترین مرجع گروه‌ها و کانال‌های تلگرام
            <br />
            <span className="text-muted-foreground">
              هزاران گروه و کانال در دسته‌بندی‌های مختلف را کشف کنید
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>هزاران کاربر فعال</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span>صدها گروه و کانال</span>
            </div>
          </div>
          
          <Button 
            onClick={handleEnter} 
            size="lg" 
            className="w-full text-lg font-semibold gap-2"
          >
            ورود به سایت
            <Sparkles className="h-5 w-5" />
          </Button>
          
          <p className="text-xs text-muted-foreground">
            با ورود به سایت، قوانین و مقررات را می‌پذیرید
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}