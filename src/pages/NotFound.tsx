import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center animate-fade-in">
        <h1 className="text-8xl font-bold text-primary">۴۰۴</h1>
        <p className="mt-4 text-xl text-muted-foreground">صفحه مورد نظر یافت نشد</p>
        <Button asChild className="mt-8 gap-2">
          <Link to="/">
            <Home className="h-4 w-4" />
            بازگشت به صفحه اصلی
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
