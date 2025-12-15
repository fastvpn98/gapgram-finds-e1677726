import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdSubmissionForm } from "@/components/AdSubmissionForm";
import { useAuth } from "@/hooks/useAuth";

export default function SubmitAd() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-hero py-8">
      <div className="container max-w-2xl">
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link to="/">
            <ArrowRight className="h-4 w-4" />
            بازگشت به صفحه اصلی
          </Link>
        </Button>

        <Card className="shadow-card animate-slide-up">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">ثبت آگهی جدید</CardTitle>
            <CardDescription>
              گروه یا کانال تلگرام خود را در گپ‌گرام ثبت کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdSubmissionForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
