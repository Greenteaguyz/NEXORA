export type PaymentMethodType = 'card' | 'khqr';

export type CardBrand = 'visa' | 'mastercard';

export type KhqrBank = 'ABA' | 'ACLEDA' | 'Wing' | 'Bakong';

export interface CardPaymentMethod {
  type: 'card';
  id: string;
  userId: string;
  brand: CardBrand;
  holder: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
  createdAt: string;
}

export interface KhqrPaymentMethod {
  type: 'khqr';
  id: string;
  userId: string;
  bank: KhqrBank;
  handle: string;
  isDefault: boolean;
  createdAt: string;
}

export type PaymentMethod = CardPaymentMethod | KhqrPaymentMethod;

export type WalletTransactionSource = 'top_up' | 'gift_card' | 'purchase';

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  source: WalletTransactionSource;
  label: string;
  createdAt: string;
}

export interface Wallet {
  userId: string;
  balance: number;
}

export interface GiftCard {
  code: string;
  amount: number;
  redeemedBy: string | null;
  redeemedAt: string | null;
}

export interface AddCardMethodDto {
  type: 'card';
  brand: CardBrand;
  holder: string;
  number: string;
  expiry: string;
}

export interface AddKhqrMethodDto {
  type: 'khqr';
  bank: KhqrBank;
  handle: string;
}

export type AddPaymentMethodDto = AddCardMethodDto | AddKhqrMethodDto;
