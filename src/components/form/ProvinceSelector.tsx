import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { PROVINCES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MapPin, Globe } from "lucide-react";

interface ProvinceSelectorProps {
  targetType: "all" | "multiple";
  onTargetTypeChange: (value: "all" | "multiple") => void;
  selectedProvinces: string[];
  onProvincesChange: (provinces: string[]) => void;
  error?: string;
}

export function ProvinceSelector({
  targetType,
  onTargetTypeChange,
  selectedProvinces,
  onProvincesChange,
  error,
}: ProvinceSelectorProps) {
  const handleProvinceToggle = (provinceValue: string, checked: boolean) => {
    if (checked) {
      onProvincesChange([...selectedProvinces, provinceValue]);
    } else {
      onProvincesChange(selectedProvinces.filter((v) => v !== provinceValue));
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">هدف‌گذاری استان</Label>
      
      <RadioGroup
        value={targetType}
        onValueChange={(value) => {
          onTargetTypeChange(value as "all" | "multiple");
          if (value === "all") {
            onProvincesChange([]);
          }
        }}
        className="flex gap-6"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="all" id="province-target-all" />
          <Label 
            htmlFor="province-target-all" 
            className="cursor-pointer flex items-center gap-2"
          >
            <Globe className="h-4 w-4 text-muted-foreground" />
            همه استان‌ها
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="multiple" id="province-target-multiple" />
          <Label 
            htmlFor="province-target-multiple" 
            className="cursor-pointer flex items-center gap-2"
          >
            <MapPin className="h-4 w-4 text-muted-foreground" />
            انتخاب استان
          </Label>
        </div>
      </RadioGroup>

      {targetType === "multiple" && (
        <div className="mt-4 border rounded-xl p-4 bg-card">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {PROVINCES.map((province) => {
              const isChecked = selectedProvinces.includes(province.value);
              return (
                <label
                  key={province.value}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-all duration-200",
                    "hover:bg-accent/50",
                    isChecked && "border-primary bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleProvinceToggle(province.value, checked as boolean)
                    }
                  />
                  <span className="text-sm">{province.label}</span>
                </label>
              );
            })}
          </div>
          {selectedProvinces.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {selectedProvinces.length} استان انتخاب شده
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
