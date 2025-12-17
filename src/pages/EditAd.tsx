import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getAdById, updateAd } from "@/lib/ads";
import { CATEGORIES, CITIES, TAGS, AGE_GROUPS } from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";

const editAdSchema = z.object({
  name: z.string().min(3, "نام باید حداقل ۳ کاراکتر باشد").max(100, "نام نباید بیش از ۱۰۰ کاراکتر باشد"),
  text: z.string().min(10, "توضیحات باید حداقل ۱۰ کاراکتر باشد").max(500, "توضیحات نباید بیش از ۵۰۰ کاراکتر باشد"),
  category: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  telegramLink: z.string().url("لینک معتبر وارد کنید").refine(
    (val) => val.includes("t.me") || val.includes("telegram"),
    "لینک باید از تلگرام باشد"
  ),
  imageUrl: z.string().url("آدرس تصویر معتبر نیست").optional().or(z.literal("")),
  members: z.coerce.number().min(0, "تعداد اعضا نمی‌تواند منفی باشد").optional(),
  cities: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  ageGroups: z.array(z.string()).optional(),
});

type EditAdFormData = z.infer<typeof editAdSchema>;

export default function EditAd() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditAdFormData>({
    resolver: zodResolver(editAdSchema),
    defaultValues: {
      name: "",
      text: "",
      category: "",
      telegramLink: "",
      imageUrl: "",
      members: 0,
      cities: [],
      tags: [],
      ageGroups: [],
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (id && user) {
      loadAd();
    }
  }, [id, user, authLoading, navigate]);

  const loadAd = async () => {
    if (!id) return;
    
    setIsLoading(true);
    const ad = await getAdById(id);
    
    if (!ad) {
      toast({ title: "خطا", description: "آگهی یافت نشد.", variant: "destructive" });
      navigate("/dashboard");
      return;
    }

    form.reset({
      name: ad.name,
      text: ad.text,
      category: ad.category,
      telegramLink: ad.telegramLink,
      imageUrl: ad.imageUrl || "",
      members: ad.members || 0,
      cities: ad.cities || [],
      tags: ad.tags || [],
      ageGroups: ad.ageGroups || [],
    });
    
    setIsLoading(false);
  };

  const onSubmit = async (data: EditAdFormData) => {
    if (!id) return;
    
    setIsSubmitting(true);
    const result = await updateAd(id, {
      name: data.name,
      text: data.text,
      category: data.category,
      telegramLink: data.telegramLink,
      imageUrl: data.imageUrl || undefined,
      members: data.members,
      cities: data.cities,
      tags: data.tags,
      ageGroups: data.ageGroups,
    });
    setIsSubmitting(false);

    if (result) {
      toast({ title: "آگهی به‌روزرسانی شد", description: "تغییرات شما با موفقیت ذخیره شد." });
      navigate("/dashboard");
    } else {
      toast({ title: "خطا", description: "مشکلی در به‌روزرسانی آگهی رخ داد.", variant: "destructive" });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex-1 container py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">ویرایش آگهی</h1>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>اطلاعات آگهی</CardTitle>
            <CardDescription>اطلاعات آگهی خود را ویرایش کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام کانال/گروه</FormLabel>
                      <FormControl>
                        <Input placeholder="نام کانال یا گروه تلگرام" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توضیحات</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="توضیحات کانال یا گروه خود را بنویسید..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>دسته‌بندی</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب دسته‌بندی" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.filter(c => c.value !== "all").map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="members"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تعداد اعضا</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="تعداد اعضای فعلی"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="telegramLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>لینک تلگرام</FormLabel>
                      <FormControl>
                        <Input 
                          dir="ltr"
                          placeholder="https://t.me/your_channel"
                          className="text-left"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>آدرس تصویر (اختیاری)</FormLabel>
                      <FormControl>
                        <Input 
                          dir="ltr"
                          placeholder="https://example.com/image.jpg"
                          className="text-left"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cities */}
                <FormField
                  control={form.control}
                  name="cities"
                  render={() => (
                    <FormItem>
                      <FormLabel>شهرها</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {CITIES.filter(c => c.value !== "all").map((city) => (
                          <FormField
                            key={city.value}
                            control={form.control}
                            name="cities"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(city.value)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      field.onChange(
                                        checked
                                          ? [...current, city.value]
                                          : current.filter((v) => v !== city.value)
                                      );
                                    }}
                                  />
                                </FormControl>
                                <span className="text-sm">{city.label}</span>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <FormField
                  control={form.control}
                  name="tags"
                  render={() => (
                    <FormItem>
                      <FormLabel>برچسب‌ها</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {TAGS.map((tag) => (
                          <FormField
                            key={tag.value}
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(tag.value)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      field.onChange(
                                        checked
                                          ? [...current, tag.value]
                                          : current.filter((v) => v !== tag.value)
                                      );
                                    }}
                                  />
                                </FormControl>
                                <span className="text-sm">{tag.label}</span>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                {/* Age Groups */}
                <FormField
                  control={form.control}
                  name="ageGroups"
                  render={() => (
                    <FormItem>
                      <FormLabel>گروه‌های سنی</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {AGE_GROUPS.filter(a => a.value !== "all").map((age) => (
                          <FormField
                            key={age.value}
                            control={form.control}
                            name="ageGroups"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(age.value)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      field.onChange(
                                        checked
                                          ? [...current, age.value]
                                          : current.filter((v) => v !== age.value)
                                      );
                                    }}
                                  />
                                </FormControl>
                                <span className="text-sm">{age.label}</span>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        در حال ذخیره...
                      </>
                    ) : (
                      "ذخیره تغییرات"
                    )}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link to="/dashboard">انصراف</Link>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
