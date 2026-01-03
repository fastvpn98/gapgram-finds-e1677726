import { MessageCircle, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TypeToggleProps {
  selectedType: "group" | "channel" | "all";
  onTypeChange: (type: "group" | "channel" | "all") => void;
}

export function TypeToggle({ selectedType, onTypeChange }: TypeToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={selectedType === "all" ? "default" : "outline"}
        onClick={() => onTypeChange("all")}
        className="flex-1 gap-2"
      >
        همه
      </Button>
      <Button
        variant={selectedType === "group" ? "default" : "outline"}
        onClick={() => onTypeChange("group")}
        className="flex-1 gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        گروه
      </Button>
      <Button
        variant={selectedType === "channel" ? "default" : "outline"}
        onClick={() => onTypeChange("channel")}
        className="flex-1 gap-2"
      >
        <Radio className="h-4 w-4" />
        کانال
      </Button>
    </div>
  );
}
