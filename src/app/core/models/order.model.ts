export type OrderStatus = 'confirmed' | 'pending' | 'failed' | 'refunded';

export interface Order {
  id: string;
  userId: string;
  gameId: string;
  price: number;
  paymentMethod?: string;
  status: OrderStatus;
  createdAt: string;
}
