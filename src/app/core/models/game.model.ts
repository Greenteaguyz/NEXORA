export interface Game {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  tags: string[];
  price: number;
  coverImageUrl: string;
  screenshotUrls: string[];
  samplePackageUrl: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateGameDto = Omit<Game, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type UpdateGameDto = Partial<CreateGameDto>;
