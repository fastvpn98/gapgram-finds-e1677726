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
  { value: "chat", label: "چت و سرگرمی", icon: Users },
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

// Provinces of Iran (31 provinces)
export const PROVINCES = [
  { value: "alborz", label: "البرز" },
  { value: "ardabil", label: "اردبیل" },
  { value: "azarbayjan-e-sharghi", label: "آذربایجان شرقی" },
  { value: "azarbayjan-e-gharbi", label: "آذربایجان غربی" },
  { value: "bushehr", label: "بوشهر" },
  { value: "chaharmahal-va-bakhtiari", label: "چهارمحال و بختیاری" },
  { value: "fars", label: "فارس" },
  { value: "gilan", label: "گیلان" },
  { value: "golestan", label: "گلستان" },
  { value: "hamadan", label: "همدان" },
  { value: "hormozgan", label: "هرمزگان" },
  { value: "ilam", label: "ایلام" },
  { value: "isfahan", label: "اصفهان" },
  { value: "kerman", label: "کرمان" },
  { value: "kermanshah", label: "کرمانشاه" },
  { value: "khorasan-e-jonubi", label: "خراسان جنوبی" },
  { value: "khorasan-e-razavi", label: "خراسان رضوی" },
  { value: "khorasan-e-shomali", label: "خراسان شمالی" },
  { value: "khuzestan", label: "خوزستان" },
  { value: "kohgiluyeh-va-boyer-ahmad", label: "کهگیلویه و بویراحمد" },
  { value: "kurdistan", label: "کردستان" },
  { value: "lorestan", label: "لرستان" },
  { value: "markazi", label: "مرکزی" },
  { value: "mazandaran", label: "مازندران" },
  { value: "qazvin", label: "قزوین" },
  { value: "qom", label: "قم" },
  { value: "semnan", label: "سمنان" },
  { value: "sistan-va-baluchestan", label: "سیستان و بلوچستان" },
  { value: "tehran", label: "تهران" },
  { value: "yazd", label: "یزد" },
  { value: "zanjan", label: "زنجان" },
];

// Keep CITIES as alias for backward compatibility
export const CITIES = PROVINCES;

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

export const AD_TYPES = [
  { value: "group", label: "گروه" },
  { value: "channel", label: "کانال" },
];
