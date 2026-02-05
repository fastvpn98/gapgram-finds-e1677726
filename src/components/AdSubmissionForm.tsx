import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X, Users, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { AGE_GROUPS, PLATFORMS } from "@/lib/constants";
import { addAd } from "@/lib/ads";
import { PlatformSelector, AdTypeSelector, CategorySelector, ProvinceSelector } from "@/components/form";

const MAX_DESCRIPTION_LENGTH = 300;
const MAX_TAGS = 5;

const formSchema = z.object({
  platform: z.enum(["telegram", "eitaa", "bale", "rubika"], {
    required_error: "پیام‌رسان را انتخاب کنید",
  }),
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
    .url("لینک معتبر وارد کنید"),
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platform: undefined,
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
  const watchAdType = form.watch("adType");
  const watchPlatform = form.watch("platform");

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطا",
        description: "حجم تصویر نباید بیش از ۵ مگابایت باشد",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطا",
        description: "فقط فایل‌های تصویری مجاز هستند",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

    setIsUploadingImage(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('ad-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('ad-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطا",
        description: "آپلود تصویر با مشکل مواجه شد",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploadingImage(false);
    }
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
      let imageUrl: string | undefined;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const provinces =
        data.provinceTarget === "all"
          ? []
          : data.selectedProvinces;

      const ageGroups =
        data.ageTarget === "all"
          ? ["all"]
          : data.selectedAgeGroups;

      const result = await addAd({
        platform: data.platform,
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
        imageUrl,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Platform Selection */}
        <FormField
          control={form.control}
          name="platform"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <PlatformSelector
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Ad Type */}
        <FormField
          control={form.control}
          name="adType"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <AdTypeSelector
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <CategorySelector
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                نام {watchAdType === "channel" ? "کانال" : watchAdType === "group" ? "گروه" : "گروه یا کانال"} *
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="مثال: فروشگاه آنلاین دیجی‌کالا" 
                  className="h-12 bg-card"
                  {...field} 
                />
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
              <FormLabel className="text-base font-semibold">توضیحات *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="توضیحات آگهی خود را بنویسید... (حداقل ۲۰ کاراکتر)"
                  className="min-h-[120px] resize-none bg-card"
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

        {/* Link */}
        <FormField
          control={form.control}
          name="telegramLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                لینک {watchPlatform ? PLATFORMS.find(p => p.value === watchPlatform)?.label : "پیام‌رسان"} *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={watchPlatform === "telegram" ? "https://t.me/your_channel" : "لینک گروه یا کانال"}
                  dir="ltr"
                  className="text-left h-12 bg-card"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">لینک کامل گروه یا کانال را وارد کنید</p>
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
              <FormLabel className="text-base font-semibold">تعداد اعضا *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Users className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="مثال: 1000"
                    dir="ltr"
                    className="text-left pr-10 h-12 bg-card"
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
          <Label className="text-base font-semibold">تصویر آگهی (اختیاری)</Label>
          <div className="border-2 border-dashed rounded-xl p-4 text-center bg-card">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="ad-image-upload"
            />
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="پیش‌نمایش"
                  className="mx-auto max-h-48 rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 left-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="ad-image-upload"
                className="cursor-pointer flex flex-col items-center gap-2 py-6"
              >
                <div className="p-4 rounded-full bg-muted">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">
                  کلیک کنید یا تصویر را بکشید
                </span>
                <span className="text-xs text-muted-foreground">
                  حداکثر ۵ مگابایت - JPG, PNG, WebP
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Province Targeting */}
        <FormField
          control={form.control}
          name="provinceTarget"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ProvinceSelector
                  targetType={field.value as "all" | "multiple"}
                  onTargetTypeChange={(value) => {
                    field.onChange(value);
                    if (value === "all") {
                      form.setValue("selectedProvinces", []);
                    }
                  }}
                  selectedProvinces={form.watch("selectedProvinces")}
                  onProvincesChange={(provinces) => form.setValue("selectedProvinces", provinces)}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Age Targeting */}
        <FormField
          control={form.control}
          name="ageTarget"
          render={({ field }) => (
            <FormItem>
              <Label className="text-base font-semibold">مخاطبان</Label>
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
                  value={field.value}
                  className="flex flex-wrap gap-4 mt-2"
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
                      className="flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-all hover:bg-accent/50"
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
                      className="h-12 bg-card"
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
                      className="h-12 bg-card"
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
          <Label className="text-base font-semibold">برچسب‌ها (حداکثر {MAX_TAGS})</Label>

          <div className="flex gap-2">
            <Input
              placeholder="برچسب جدید..."
              className="h-12 bg-card"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" variant="outline" size="lg" onClick={handleAddTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {watchTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {watchTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pl-1 py-1.5 text-sm">
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

        <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
