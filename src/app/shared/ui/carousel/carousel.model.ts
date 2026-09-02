export interface CarouselSlide<T = any> {
  id: string;
  title: string;
  mainImageUrl: string;
  thumbnailUrls: string[];
  eyebrow?: string;
  price?: number;
  tags?: string[];
  reviewSentiment?: string;
  ratingScore?: number;
  data?: T;
}

export interface CarouselConfig {
  autoplayMs?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
}
