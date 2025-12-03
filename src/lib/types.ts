export interface RankedAd {
  id: string;
  name: string;
  text: string;
  category: string;
  telegramLink: string;
  createdAt: string;
  imageUrl: string;
  members: number;
  tags: string[];
  cities: string[];
  ageGroups: string[];
  minAge?: number;
  maxAge?: number;
  relevanceScore: number;
}

export interface AdFormData {
  category: string;
  name: string;
  text: string;
  telegramLink: string;
  members: number;
  imageUrl: string;
  cities: string[];
  ageGroups: string[];
  minAge?: number;
  maxAge?: number;
  tags: string[];
}
