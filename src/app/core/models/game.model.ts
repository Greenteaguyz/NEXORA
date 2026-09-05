export type GameStatus = 'draft' | 'published' | 'archived';

export interface Game {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  tags: string[];
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  coverImageUrl: string;
  screenshotUrls: string[];
  samplePackageUrl: string;
  status?: GameStatus;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateGameDto = Omit<Game, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type UpdateGameDto = Partial<CreateGameDto>;

