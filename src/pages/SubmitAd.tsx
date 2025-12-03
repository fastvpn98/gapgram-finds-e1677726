import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdSubmissionForm } from "@/components/AdSubmissionForm";

export default function SubmitAd() {
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
