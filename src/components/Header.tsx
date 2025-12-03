import { Link } from "react-router-dom";
import { PlusCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
            <MessageCircle className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">گپ‌گرام</span>
        </Link>

        <Button asChild className="gap-2 shadow-md">
          <Link to="/submit-ad">
            <PlusCircle className="h-5 w-5" />
            <span>ثبت آگهی</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
