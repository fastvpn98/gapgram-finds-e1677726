import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES, CITIES, AGE_GROUPS } from "@/lib/constants";
import { addAd } from "@/lib/ads";

const formSchema = z.object({
  category: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  name: z
    .string()
    .min(3, "نام باید حداقل ۳ کاراکتر باشد")
    .max(100, "نام نباید بیش از ۱۰۰ کاراکتر باشد"),
  text: z
    .string()
    .min(10, "توضیحات باید حداقل ۱۰ کاراکتر باشد")
    .max(500, "توضیحات نباید بیش از ۵۰۰ کاراکتر باشد"),
  telegramLink: z
    .string()
    .url("لینک معتبر وارد کنید")
    .regex(/^https?:\/\/(t\.me|telegram\.me)\//, "لینک باید از تلگرام باشد"),
  members: z.coerce.number().min(0, "تعداد اعضا معتبر نیست"),
  imageUrl: z.string().url("لینک تصویر معتبر نیست").optional().or(z.literal("")),
  cityTarget: z.enum(["all", "one", "multiple"]),
  selectedCities: z.array(z.string()),
  ageTarget: z.enum(["all", "list", "custom"]),
  selectedAgeGroups: z.array(z.string()),
  minAge: z.coerce.number().min(0).max(120).optional(),
  maxAge: z.coerce.number().min(0).max(120).optional(),
  tags: z.array(z.string()),
});

type FormData = z.infer<typeof formSchema>;

export function AdSubmissionForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      name: "",
      text: "",
      telegramLink: "",
      members: 0,
      imageUrl: "",
      cityTarget: "all",
      selectedCities: [],
      ageTarget: "all",
      selectedAgeGroups: [],
      minAge: undefined,
      maxAge: undefined,
      tags: [],
    },
  });

  const watchText = form.watch("text");
  const watchCityTarget = form.watch("cityTarget");
  const watchAgeTarget = form.watch("ageTarget");
  const watchTags = form.watch("tags");

  const handleAddTag = () => {
    if (customTag.trim() && !watchTags.includes(customTag.trim())) {
      form.setValue("tags", [...watchTags, customTag.trim()]);
      setCustomTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    form.setValue(
      "tags",
      watchTags.filter((t) => t !== tag)
    );
  };

  const handleImageUrlChange = (url: string) => {
    form.setValue("imageUrl", url);
    setImagePreview(url);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const cities =
        data.cityTarget === "all"
          ? []
          : data.selectedCities;

      const ageGroups =
        data.ageTarget === "all"
          ? ["all"]
          : data.selectedAgeGroups;

      await addAd({
        category: data.category,
        name: data.name,
        text: data.text,
        telegramLink: data.telegramLink,
        members: data.members,
        imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop",
        cities,
        ageGroups,
        minAge: data.ageTarget === "custom" ? data.minAge : undefined,
        maxAge: data.ageTarget === "custom" ? data.maxAge : undefined,
        tags: data.tags,
      });

      toast({
        title: "آگهی ثبت شد!",
        description: "آگهی شما با موفقیت ثبت شد.",
      });

      navigate("/");
    } catch {
      toast({
        title: "خطا",
        description: "ثبت آگهی با مشکل مواجه شد.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>دسته‌بندی</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب دسته‌بندی" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام گروه یا کانال</FormLabel>
              <FormControl>
                <Input placeholder="مثال: فروشگاه آنلاین دیجی‌کالا" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>توضیحات</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="توضیحات آگهی خود را بنویسید..."
                  className="min-h-[100px] resize-none"
                  {...field}
                />
              </FormControl>
              <div className="flex justify-between text-xs text-muted-foreground">
                <FormMessage />
                <span>{watchText.length}/500</span>
              </div>
            </FormItem>
          )}
        />

        {/* Telegram Link */}
        <FormField
          control={form.control}
          name="telegramLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>لینک تلگرام</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://t.me/your_channel"
                  dir="ltr"
                  className="text-left"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Members */}
        <FormField
          control={form.control}
          name="members"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تعداد اعضا</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  dir="ltr"
                  className="text-left"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image URL */}
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>لینک تصویر (اختیاری)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/image.jpg"
                  dir="ltr"
                  className="text-left"
                  {...field}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                />
              </FormControl>
              {imagePreview && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={() => setImagePreview("")}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">پیش‌نمایش تصویر</span>
                </div>
              )}
              {!imagePreview && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  <span>تصویر پیش‌فرض استفاده خواهد شد</span>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* City Targeting */}
        <FormField
          control={form.control}
          name="cityTarget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>هدف‌گذاری شهر</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="all" id="city-all" />
                    <Label htmlFor="city-all">همه شهرها</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="one" id="city-one" />
                    <Label htmlFor="city-one">یک شهر</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="multiple" id="city-multiple" />
                    <Label htmlFor="city-multiple">چند شهر</Label>
                  </div>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {watchCityTarget !== "all" && (
          <FormField
            control={form.control}
            name="selectedCities"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CITIES.map((city) => (
                    <label
                      key={city.value}
                      className="flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors hover:bg-secondary"
                    >
                      <Checkbox
                        checked={field.value.includes(city.value)}
                        onCheckedChange={(checked) => {
                          if (watchCityTarget === "one") {
                            field.onChange(checked ? [city.value] : []);
                          } else {
                            field.onChange(
                              checked
                                ? [...field.value, city.value]
                                : field.value.filter((v) => v !== city.value)
                            );
                          }
                        }}
                      />
                      <span className="text-sm">{city.label}</span>
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Age Targeting */}
        <FormField
          control={form.control}
          name="ageTarget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>مخاطبان</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="all" id="age-all" />
                    <Label htmlFor="age-all">همه سنین</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="list" id="age-list" />
                    <Label htmlFor="age-list">انتخاب از لیست</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="custom" id="age-custom" />
                    <Label htmlFor="age-custom">بازه سنی سفارشی</Label>
                  </div>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {watchAgeTarget === "list" && (
          <FormField
            control={form.control}
            name="selectedAgeGroups"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-2 gap-2">
                  {AGE_GROUPS.filter((a) => a.value !== "all").map((age) => (
                    <label
                      key={age.value}
                      className="flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors hover:bg-secondary"
                    >
                      <Checkbox
                        checked={field.value.includes(age.value)}
                        onCheckedChange={(checked) => {
                          field.onChange(
                            checked
                              ? [...field.value, age.value]
                              : field.value.filter((v) => v !== age.value)
                          );
                        }}
                      />
                      <span className="text-sm">{age.label}</span>
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {watchAgeTarget === "custom" && (
          <div className="flex gap-4">
            <FormField
              control={form.control}
              name="minAge"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>حداقل سن</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="۱۸" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxAge"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>حداکثر سن</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="۶۵" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Tags */}
        <div className="space-y-3">
          <Label>برچسب‌ها</Label>
          <div className="flex gap-2">
            <Input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="برچسب جدید..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={handleAddTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {watchTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {watchTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="rounded-full p-0.5 hover:bg-primary/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          ثبت آگهی
        </Button>
      </form>
    </Form>
  );
}
