export type OrderStatus = 'confirmed' | 'pending' | 'failed';

export interface Order {
  id: string;
  userId: string;
  gameId: string;
  price: number;
  status: OrderStatus;
  createdAt: string;
}
