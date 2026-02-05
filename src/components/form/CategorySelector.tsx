import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";

interface CategorySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function CategorySelector({ value, onChange, error }: CategorySelectorProps) {
  const selectedCategory = CATEGORIES.find((c) => c.value === value);

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">دسته‌بندی *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12 bg-card">
          <SelectValue placeholder="انتخاب دسته‌بندی">
            {selectedCategory && (
              <div className="flex items-center gap-2">
                <selectedCategory.icon className="h-4 w-4 text-primary" />
                <span>{selectedCategory.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {CATEGORIES.map((cat) => (
            <SelectItem 
              key={cat.value} 
              value={cat.value}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-3 py-1">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <cat.icon className="h-4 w-4 text-primary" />
                </div>
                <span>{cat.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
