import {
  ShoppingBag,
  Briefcase,
  GraduationCap,
  Gamepad2,
  Heart,
  Newspaper,
  Music,
  Utensils,
  Car,
  Home,
  Laptop,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
  { value: "shopping", label: "خرید و فروش", icon: ShoppingBag },
  { value: "jobs", label: "کار و استخدام", icon: Briefcase },
  { value: "education", label: "آموزش", icon: GraduationCap },
  { value: "entertainment", label: "سرگرمی", icon: Gamepad2 },
  { value: "health", label: "سلامت", icon: Heart },
  { value: "news", label: "اخبار", icon: Newspaper },
  { value: "music", label: "موسیقی", icon: Music },
  { value: "food", label: "غذا و رستوران", icon: Utensils },
  { value: "automotive", label: "خودرو", icon: Car },
  { value: "realestate", label: "املاک", icon: Home },
  { value: "tech", label: "تکنولوژی", icon: Laptop },
  { value: "social", label: "اجتماعی", icon: Users },
];

export const CITIES = [
  { value: "tehran", label: "تهران" },
  { value: "mashhad", label: "مشهد" },
  { value: "isfahan", label: "اصفهان" },
  { value: "shiraz", label: "شیراز" },
  { value: "tabriz", label: "تبریز" },
  { value: "karaj", label: "کرج" },
  { value: "ahvaz", label: "اهواز" },
  { value: "qom", label: "قم" },
  { value: "kermanshah", label: "کرمانشاه" },
  { value: "rasht", label: "رشت" },
  { value: "yazd", label: "یزد" },
  { value: "urmia", label: "ارومیه" },
  { value: "zahedan", label: "زاهدان" },
  { value: "hamadan", label: "همدان" },
  { value: "arak", label: "اراک" },
  { value: "ardabil", label: "اردبیل" },
  { value: "sanandaj", label: "سنندج" },
  { value: "gorgan", label: "گرگان" },
  { value: "sari", label: "ساری" },
  { value: "bandarabbas", label: "بندرعباس" },
  { value: "birjand", label: "بیرجند" },
  { value: "bojnurd", label: "بجنورد" },
  { value: "bushehr", label: "بوشهر" },
  { value: "ilam", label: "ایلام" },
  { value: "khorramabad", label: "خرم‌آباد" },
  { value: "yasuj", label: "یاسوج" },
  { value: "zanjan", label: "زنجان" },
  { value: "semnan", label: "سمنان" },
  { value: "shahroud", label: "شاهرود" },
  { value: "shahr-e-kord", label: "شهرکرد" },
];

export const TAGS = [
  { value: "free", label: "رایگان" },
  { value: "discount", label: "تخفیف" },
  { value: "new", label: "جدید" },
  { value: "verified", label: "تأیید شده" },
  { value: "popular", label: "محبوب" },
  { value: "premium", label: "ویژه" },
  { value: "trusted", label: "معتبر" },
  { value: "active", label: "فعال" },
];

export const AGE_GROUPS = [
  { value: "youth", label: "جوانان (۱۸-۲۵)" },
  { value: "adults", label: "بزرگسالان (۲۵-۴۰)" },
  { value: "middle", label: "میانسال (۴۰-۶۰)" },
  { value: "senior", label: "سالمندان (۶۰+)" },
  { value: "all", label: "همه سنین" },
];
