import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X, Users, MessageCircle, Radio } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, PROVINCES, AGE_GROUPS } from "@/lib/constants";
import { addAd } from "@/lib/ads";

const MAX_DESCRIPTION_LENGTH = 300;
const MAX_TAGS = 5;

const formSchema = z.object({
  adType: z.enum(["group", "channel"], {
    required_error: "نوع آگهی را انتخاب کنید",
  }),
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
  provinceTarget: z.enum(["all", "multiple"]),
  selectedProvinces: z.array(z.string()),
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
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customTag, setCustomTag] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adType: undefined,
      category: "",
      name: "",
      text: "",
      telegramLink: "",
      members: 0,
      provinceTarget: "all",
      selectedProvinces: [],
      ageTarget: "all",
      selectedAgeGroups: [],
      minAge: null,
      maxAge: null,
      tags: [],
    },
  });

  const watchText = form.watch("text");
  const watchProvinceTarget = form.watch("provinceTarget");
  const watchAgeTarget = form.watch("ageTarget");
  const watchTags = form.watch("tags");
  const watchCategory = form.watch("category");
  const watchAdType = form.watch("adType");

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

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "خطا",
        description: "برای ثبت آگهی باید وارد شوید",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);
    try {
      const provinces =
        data.provinceTarget === "all"
          ? []
          : data.selectedProvinces;

      const ageGroups =
        data.ageTarget === "all"
          ? ["all"]
          : data.selectedAgeGroups;

      const result = await addAd({
        adType: data.adType,
        category: data.category,
        name: data.name,
        text: data.text,
        telegramLink: data.telegramLink,
        members: data.members,
        provinces,
        ageGroups,
        minAge: data.ageTarget === "custom" ? data.minAge ?? undefined : undefined,
        maxAge: data.ageTarget === "custom" ? data.maxAge ?? undefined : undefined,
        tags: data.tags,
      }, user.id);

      if (result) {
        toast({
          title: "آگهی ثبت شد!",
          description: "آگهی شما پس از تأیید مدیر نمایش داده خواهد شد.",
        });
        navigate("/dashboard");
      } else {
        throw new Error("Failed to add ad");
      }
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
        {/* Ad Type - FIRST QUESTION */}
        <FormField
          control={form.control}
          name="adType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-lg font-semibold">نوع آگهی *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-4"
                >
                  <div className="flex-1">
                    <RadioGroupItem 
                      value="group" 
                      id="type-group" 
                      className="peer sr-only" 
                    />
                    <Label 
                      htmlFor="type-group" 
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <MessageCircle className="h-8 w-8 mb-2" />
                      <span className="font-medium">گروه</span>
                      <span className="text-xs text-muted-foreground mt-1">Group</span>
                    </Label>
                  </div>
                  <div className="flex-1">
                    <RadioGroupItem 
                      value="channel" 
                      id="type-channel" 
                      className="peer sr-only" 
                    />
                    <Label 
                      htmlFor="type-channel" 
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Radio className="h-8 w-8 mb-2" />
                      <span className="font-medium">کانال</span>
                      <span className="text-xs text-muted-foreground mt-1">Channel</span>
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
              <FormLabel>
                نام {watchAdType === "channel" ? "کانال" : watchAdType === "group" ? "گروه" : "گروه یا کانال"} *
              </FormLabel>
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

        {/* Province Targeting */}
        <FormField
          control={form.control}
          name="provinceTarget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>هدف‌گذاری استان</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === "all") {
                      form.setValue("selectedProvinces", []);
                    }
                  }}
                  defaultValue={field.value}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="all" id="province-all" />
                    <Label htmlFor="province-all" className="cursor-pointer">همه استان‌ها</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="multiple" id="province-multiple" />
                    <Label htmlFor="province-multiple" className="cursor-pointer">انتخاب استان</Label>
                  </div>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {watchProvinceTarget === "multiple" && (
          <FormField
            control={form.control}
            name="selectedProvinces"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-64 overflow-y-auto p-2 border rounded-lg">
                  {PROVINCES.map((province) => (
                    <label
                      key={province.value}
                      className="flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors hover:bg-secondary"
                    >
                      <Checkbox
                        checked={field.value.includes(province.value)}
                        onCheckedChange={(checked) => {
                          field.onChange(
                            checked
                              ? [...field.value, province.value]
                              : field.value.filter((v) => v !== province.value)
                          );
                        }}
                      />
                      <span className="text-sm">{province.label}</span>
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
                    <Label htmlFor="age-custom" className="cursor-pointer">محدوده سنی</Label>
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
                <div className="flex flex-wrap gap-2">
                  {AGE_GROUPS.map((age) => (
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
                      dir="ltr"
                      {...field}
                      value={field.value ?? ""}
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
                      dir="ltr"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Tags */}
        <div className="space-y-3">
          <Label>برچسب‌ها (حداکثر {MAX_TAGS})</Label>

          <div className="flex gap-2">
            <Input
              placeholder="برچسب جدید..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {watchTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {watchTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pl-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="rounded-full p-0.5 hover:bg-foreground/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              در حال ثبت...
            </>
          ) : (
            "ثبت آگهی"
          )}
        </Button>
      </form>
    </Form>
  );
}
