import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X, ImageIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { CATEGORIES, CITIES, AGE_GROUPS, TAGS } from "@/lib/constants";
import { addAd } from "@/lib/ads";

const MAX_DESCRIPTION_LENGTH = 300;
const MAX_TAGS = 5;
const MAX_CITIES = 5;

const formSchema = z.object({
  category: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  name: z
    .string()
    .min(3, "نام باید حداقل ۳ کاراکتر باشد")
    .max(50, "نام نباید بیش از ۵۰ کاراکتر باشد"),
  text: z
    .string()
    .min(20, "توضیحات باید حداقل ۲۰ کاراکتر باشد")
    .max(MAX_DESCRIPTION_LENGTH, `توضیحات نباید بیش از ${MAX_DESCRIPTION_LENGTH} کاراکتر باشد`),
  telegramLink: z
    .string()
    .url("لینک معتبر وارد کنید")
    .refine(
      (val) => val.startsWith("https://t.me/"),
      "لینک باید با https://t.me/ شروع شود"
    ),
  members: z.coerce
    .number({ invalid_type_error: "عدد معتبر وارد کنید" })
    .positive("تعداد اعضا باید مثبت باشد"),
  imageUrl: z
    .string()
    .refine(
      (val) => val === "" || val.startsWith("data:image/") || val.startsWith("https://"),
      "فرمت تصویر معتبر نیست"
    )
    .optional()
    .or(z.literal("")),
  cityTarget: z.enum(["all", "one", "multiple"]),
  selectedCities: z
    .array(z.string())
    .max(MAX_CITIES, `حداکثر ${MAX_CITIES} شهر می‌توانید انتخاب کنید`),
  ageTarget: z.enum(["all", "list", "custom"]),
  selectedAgeGroups: z.array(z.string()),
  minAge: z.coerce.number().min(13, "حداقل سن ۱۳ سال است").optional().nullable(),
  maxAge: z.coerce.number().max(120, "حداکثر سن ۱۲۰ سال است").optional().nullable(),
  tags: z
    .array(z.string())
    .max(MAX_TAGS, `حداکثر ${MAX_TAGS} برچسب می‌توانید اضافه کنید`),
}).refine(
  (data) => {
    if (data.ageTarget === "custom" && data.minAge && data.maxAge) {
      return data.maxAge >= data.minAge;
    }
    return true;
  },
  {
    message: "حداکثر سن باید بزرگتر یا مساوی حداقل سن باشد",
    path: ["maxAge"],
  }
);

type FormData = z.infer<typeof formSchema>;

export function AdSubmissionForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string>("");

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
      minAge: null,
      maxAge: null,
      tags: [],
    },
  });

  const watchText = form.watch("text");
  const watchCityTarget = form.watch("cityTarget");
  const watchAgeTarget = form.watch("ageTarget");
  const watchTags = form.watch("tags");
  const watchCategory = form.watch("category");

  const handleAddTag = () => {
    const trimmedTag = customTag.trim();
    if (trimmedTag && !watchTags.includes(trimmedTag) && watchTags.length < MAX_TAGS) {
      form.setValue("tags", [...watchTags, trimmedTag]);
      setCustomTag("");
    } else if (watchTags.length >= MAX_TAGS) {
      toast({
        title: "محدودیت برچسب",
        description: `حداکثر ${MAX_TAGS} برچسب می‌توانید اضافه کنید`,
        variant: "destructive",
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    form.setValue(
      "tags",
      watchTags.filter((t) => t !== tag)
    );
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطا",
          description: "حجم فایل نباید بیشتر از ۵ مگابایت باشد",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageDataUrl(result);
        form.setValue("imageUrl", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageDataUrl("");
    form.setValue("imageUrl", "");
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

      const finalImageUrl = data.imageUrl || 
        `https://picsum.photos/seed/${Date.now()}/400/300`;

      await addAd({
        category: data.category,
        name: data.name,
        text: data.text,
        telegramLink: data.telegramLink,
        members: data.members,
        imageUrl: finalImageUrl,
        cities,
        ageGroups,
        minAge: data.ageTarget === "custom" ? data.minAge ?? undefined : undefined,
        maxAge: data.ageTarget === "custom" ? data.maxAge ?? undefined : undefined,
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

  const selectedCategory = CATEGORIES.find((c) => c.value === watchCategory);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>دسته‌بندی *</FormLabel>
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
              {selectedCategory && (
                <p className="text-xs text-muted-foreground mt-1">
                  دسته‌بندی انتخاب شده: {selectedCategory.label}
                </p>
              )}
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
              <FormLabel>نام گروه یا کانال *</FormLabel>
              <FormControl>
                <Input placeholder="مثال: فروشگاه آنلاین دیجی‌کالا" {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">۳ تا ۵۰ کاراکتر</p>
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
              <FormLabel>توضیحات *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="توضیحات آگهی خود را بنویسید... (حداقل ۲۰ کاراکتر)"
                  className="min-h-[100px] resize-none"
                  {...field}
                />
              </FormControl>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>حداقل ۲۰ کاراکتر</span>
                <span className={watchText.length > MAX_DESCRIPTION_LENGTH ? "text-destructive" : ""}>
                  {watchText.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Telegram Link */}
        <FormField
          control={form.control}
          name="telegramLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>لینک تلگرام *</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://t.me/your_channel"
                  dir="ltr"
                  className="text-left"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">لینک باید با https://t.me/ شروع شود</p>
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
              <FormLabel>تعداد اعضا *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Users className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="مثال: 1000"
                    dir="ltr"
                    className="text-left pr-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload */}
        <div className="space-y-3">
          <Label>تصویر (اختیاری)</Label>
          <div className="flex flex-col gap-3">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="cursor-pointer"
            />
            <input type="hidden" {...form.register("imageUrl")} value={imageDataUrl} />
            
            {imageDataUrl ? (
              <div className="relative inline-block">
                <img
                  src={imageDataUrl}
                  alt="پیش‌نمایش"
                  className="h-32 w-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -left-2 h-6 w-6"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
                <span className="block text-sm text-muted-foreground mt-1">پیش‌نمایش تصویر</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg border-dashed">
                <ImageIcon className="h-5 w-5" />
                <span>تصویر پیش‌فرض استفاده خواهد شد (حداکثر ۵ مگابایت)</span>
              </div>
            )}
          </div>
        </div>

        {/* City Targeting */}
        <FormField
          control={form.control}
          name="cityTarget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>هدف‌گذاری شهر</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === "all") {
                      form.setValue("selectedCities", []);
                    }
                  }}
                  defaultValue={field.value}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="all" id="city-all" />
                    <Label htmlFor="city-all" className="cursor-pointer">همه شهرها</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="one" id="city-one" />
                    <Label htmlFor="city-one" className="cursor-pointer">یک شهر</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="multiple" id="city-multiple" />
                    <Label htmlFor="city-multiple" className="cursor-pointer">چند شهر (حداکثر {MAX_CITIES})</Label>
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
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-48 overflow-y-auto p-2 border rounded-lg">
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
                            if (checked && field.value.length >= MAX_CITIES) {
                              toast({
                                title: "محدودیت",
                                description: `حداکثر ${MAX_CITIES} شهر می‌توانید انتخاب کنید`,
                                variant: "destructive",
                              });
                              return;
                            }
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
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === "all") {
                      form.setValue("selectedAgeGroups", []);
                      form.setValue("minAge", null);
                      form.setValue("maxAge", null);
                    }
                  }}
                  defaultValue={field.value}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="all" id="age-all" />
                    <Label htmlFor="age-all" className="cursor-pointer">همه سنین</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="list" id="age-list" />
                    <Label htmlFor="age-list" className="cursor-pointer">انتخاب از لیست</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="custom" id="age-custom" />
                    <Label htmlFor="age-custom" className="cursor-pointer">بازه سنی سفارشی</Label>
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
                    <Input 
                      type="number" 
                      placeholder="۱۳" 
                      min={13}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
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
                    <Input 
                      type="number" 
                      placeholder="۶۵" 
                      max={120}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Predefined Tags (show for entertainment category) */}
        {watchCategory === "entertainment" && (
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>برچسب‌های پیشنهادی</FormLabel>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TAGS.map((tag) => (
                    <label
                      key={tag.value}
                      className="flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors hover:bg-secondary"
                    >
                      <Checkbox
                        checked={field.value.includes(tag.value)}
                        onCheckedChange={(checked) => {
                          if (checked && field.value.length >= MAX_TAGS) {
                            toast({
                              title: "محدودیت",
                              description: `حداکثر ${MAX_TAGS} برچسب می‌توانید انتخاب کنید`,
                              variant: "destructive",
                            });
                            return;
                          }
                          field.onChange(
                            checked
                              ? [...field.value, tag.value]
                              : field.value.filter((v) => v !== tag.value)
                          );
                        }}
                      />
                      <span className="text-sm">{tag.label}</span>
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Custom Tags */}
        <div className="space-y-3">
          <Label>برچسب‌های سفارشی (حداکثر {MAX_TAGS})</Label>
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
              disabled={watchTags.length >= MAX_TAGS}
            />
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleAddTag}
              disabled={watchTags.length >= MAX_TAGS || !customTag.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {watchTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {watchTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {TAGS.find((t) => t.value === tag)?.label || tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="rounded-full p-0.5 hover:bg-primary/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {watchTags.length}/{MAX_TAGS} برچسب انتخاب شده
          </p>
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "در حال ثبت..." : "ثبت آگهی"}
        </Button>
      </form>
    </Form>
  );
}