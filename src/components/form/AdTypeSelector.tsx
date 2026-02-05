import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Users, Megaphone } from "lucide-react";

interface AdTypeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

const adTypes = [
  {
    value: "group",
    label: "گروه",
    sublabel: "Group",
    description: "برای گروه‌های گفتگو و تعامل اعضا",
    icon: Users,
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    value: "channel",
    label: "کانال",
    sublabel: "Channel",
    description: "برای انتشار محتوا به مخاطبان",
    icon: Megaphone,
    iconBg: "bg-purple-100 text-purple-600",
  },
];

export function AdTypeSelector({ value, onChange, error }: AdTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">نوع آگهی *</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {adTypes.map((type) => {
          const Icon = type.icon;
          return (
            <div key={type.value} className="relative">
              <RadioGroupItem
                value={type.value}
                id={`adtype-${type.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`adtype-${type.value}`}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-xl border-2 bg-card p-6 transition-all duration-200 cursor-pointer min-h-[140px]",
                  "hover:bg-accent/50 hover:shadow-md",
                  "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:shadow-lg",
                  "[&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                )}
              >
                <div className={cn("p-3 rounded-full", type.iconBg)}>
                  <Icon className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <span className="font-bold text-lg block">{type.label}</span>
                  <span className="text-xs text-muted-foreground">{type.sublabel}</span>
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
