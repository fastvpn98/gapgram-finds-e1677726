import { useState } from "react";
import { ChevronDown, MapPin, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CITIES, AGE_GROUPS, TAGS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  selectedCities: string[];
  selectedAgeGroups: string[];
  selectedTags: string[];
  onCitiesChange: (cities: string[]) => void;
  onAgeGroupsChange: (ageGroups: string[]) => void;
  onTagsChange: (tags: string[]) => void;
}

export function FilterSidebar({
  selectedCities,
  selectedAgeGroups,
  selectedTags,
  onCitiesChange,
  onAgeGroupsChange,
  onTagsChange,
}: FilterSidebarProps) {
  const [cityOpen, setCityOpen] = useState(true);
  const [ageOpen, setAgeOpen] = useState(true);
  const [tagOpen, setTagOpen] = useState(true);

  const toggleCity = (value: string) => {
    if (selectedCities.includes(value)) {
      onCitiesChange(selectedCities.filter((c) => c !== value));
    } else {
      onCitiesChange([...selectedCities, value]);
    }
  };

  const toggleAgeGroup = (value: string) => {
    if (selectedAgeGroups.includes(value)) {
      onAgeGroupsChange(selectedAgeGroups.filter((a) => a !== value));
    } else {
      onAgeGroupsChange([...selectedAgeGroups, value]);
    }
  };

  const toggleTag = (value: string) => {
    if (selectedTags.includes(value)) {
      onTagsChange(selectedTags.filter((t) => t !== value));
    } else {
      onTagsChange([...selectedTags, value]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cities Filter */}
      <Collapsible open={cityOpen} onOpenChange={setCityOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-3 hover:bg-secondary"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">شهر</span>
              {selectedCities.length > 0 && (
                <span className="mr-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {selectedCities.length}
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                cityOpen && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3">
          <div className="space-y-2">
            {CITIES.map((city) => (
              <label
                key={city.value}
                className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-secondary"
              >
                <Checkbox
                  checked={selectedCities.includes(city.value)}
                  onCheckedChange={() => toggleCity(city.value)}
                />
                <span className="text-sm">{city.label}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Age Groups Filter */}
      <Collapsible open={ageOpen} onOpenChange={setAgeOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-3 hover:bg-secondary"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">گروه سنی</span>
              {selectedAgeGroups.length > 0 && (
                <span className="mr-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {selectedAgeGroups.length}
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                ageOpen && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3">
          <div className="space-y-2">
            {AGE_GROUPS.map((age) => (
              <label
                key={age.value}
                className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-secondary"
              >
                <Checkbox
                  checked={selectedAgeGroups.includes(age.value)}
                  onCheckedChange={() => toggleAgeGroup(age.value)}
                />
                <span className="text-sm">{age.label}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Tags Filter */}
      <Collapsible open={tagOpen} onOpenChange={setTagOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-3 hover:bg-secondary"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">برچسب‌های محبوب</span>
              {selectedTags.length > 0 && (
                <span className="mr-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {selectedTags.length}
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                tagOpen && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3">
          <div className="space-y-2">
            {TAGS.map((tag) => (
              <label
                key={tag.value}
                className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-secondary"
              >
                <Checkbox
                  checked={selectedTags.includes(tag.value)}
                  onCheckedChange={() => toggleTag(tag.value)}
                />
                <span className="text-sm">{tag.label}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
