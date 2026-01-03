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
  provinces: string[];  // renamed from cities
  ageGroups: string[];
  minAge?: number;
  maxAge?: number;
  relevanceScore: number;
  status?: 'pending' | 'approved' | 'rejected';
  isApproved?: boolean;
  likesCount?: number;
  isLiked?: boolean;
  adType: 'group' | 'channel';  // new field
}

export interface AdFormData {
  adType: 'group' | 'channel';  // new field - first question
  category: string;
  name: string;
  text: string;
  telegramLink: string;
  members: number;
  imageUrl?: string;
  provinces: string[];  // renamed from cities
  ageGroups: string[];
  minAge?: number;
  maxAge?: number;
  tags: string[];
}

export type UserRole = 'admin' | 'moderator' | 'user';
