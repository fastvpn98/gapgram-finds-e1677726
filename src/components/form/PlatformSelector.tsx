import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PLATFORMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import TelegramLogo from "@/assets/logos/telegram.svg";
import { MessageSquare, MessageCircle, Radio } from "lucide-react";

interface PlatformSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  telegram: <img src={TelegramLogo} alt="تلگرام" className="h-10 w-10" />,
  eitaa: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#ee7d00" }}>
      <MessageSquare className="h-6 w-6 text-white" />
    </div>
  ),
  bale: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#00b862" }}>
      <MessageCircle className="h-6 w-6 text-white" />
    </div>
  ),
  rubika: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#f04a4c" }}>
      <Radio className="h-6 w-6 text-white" />
    </div>
  ),
};

export function PlatformSelector({ value, onChange, error }: PlatformSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">پیام‌رسان *</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {PLATFORMS.map((platform) => (
          <div key={platform.value} className="relative">
            <RadioGroupItem
              value={platform.value}
              id={`platform-${platform.value}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`platform-${platform.value}`}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 bg-card p-4 transition-all duration-200 cursor-pointer",
                "hover:bg-accent/50 hover:shadow-md",
                "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:shadow-lg",
                "[&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
              )}
            >
              {platformIcons[platform.value]}
              <span className="font-medium text-sm">{platform.label}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
