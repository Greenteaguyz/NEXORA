import {
  AddCardMethodDto,
  AddKhqrMethodDto,
  AddPaymentMethodDto,
  CardPaymentMethod,
  GiftCard,
  KhqrPaymentMethod,
  PaymentMethod,
  WalletTransaction
} from '../../models/payment.model';

/** USD -> KHR display approximation (Bakong market rate, stable since 2022). */
export const USD_TO_KHR_RATE = 4100;

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function approxKhr(amount: number): string {
  return `\u17DB${Math.round(amount * USD_TO_KHR_RATE).toLocaleString('en-US')}`;
}

export function luhnCheck(number: string): boolean {
  const digits = number.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digits)) {
    return false;
  }
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) {
        d -= 9;
      }
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function detectCardBrand(number: string): 'visa' | 'mastercard' | null {
  const digits = number.replace(/[\s-]/g, '');
  if (/^4/.test(digits)) {
    return 'visa';
  }
  if (/^(5[1-5]|2[2-7])/.test(digits)) {
    return 'mastercard';
  }
  return null;
}

/**
 * Normalizes raw card-expiry input to MM/YY: strips non-digits, caps at 4
 * digits, and inserts the slash after the second digit. Pure helper shared
 * by ExpiryDateDirective and tests.
 */
export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function isCardExpired(expiry: string, now: Date = new Date()): boolean {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(expiry.trim());
  if (!match) {
    return true;
  }
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) {
    return true;
  }
  // Card stays valid through the last day of its expiry month.
  const endOfMonth = new Date(year, month, 1);
  return endOfMonth <= now;
}

export function isDuplicateCard(methods: PaymentMethod[], dto: AddCardMethodDto): boolean {
  const last4 = dto.number.replace(/[\s-]/g, '').slice(-4);
  return methods.some(m => m.type === 'card' && m.last4 === last4 && m.brand === dto.brand);
}

export function isDuplicateKhqr(methods: PaymentMethod[], dto: AddKhqrMethodDto): boolean {
  const handle = dto.handle.trim().toLowerCase();
  return methods.some(m => m.type === 'khqr' && m.handle.toLowerCase() === handle);
}

export interface CardValidationResult {
  valid: boolean;
  errors: string[];
  brand: 'visa' | 'mastercard' | null;
  last4: string;
}

export function validateCardInput(dto: AddCardMethodDto, methods: PaymentMethod[], now: Date = new Date()): CardValidationResult {
  const errors: string[] = [];
  const digits = dto.number.replace(/[\s-]/g, '');
  const brand = detectCardBrand(digits);

  if (!luhnCheck(digits)) {
    errors.push('Check the card number');
  }
  if (!brand) {
    errors.push('Only Visa and Mastercard are supported');
  }
  if (isCardExpired(dto.expiry, now)) {
    errors.push('This card has expired');
  }
  if (!dto.holder || dto.holder.trim().length < 2) {
    errors.push('Cardholder name is required');
  }
  if (isDuplicateCard(methods, dto)) {
    errors.push('This card is already saved');
  }
  return { valid: errors.length === 0, errors, brand, last4: digits.slice(-4) };
}

export function toCardMethod(dto: AddCardMethodDto, userId: string, validation: CardValidationResult, now: Date = new Date()): CardPaymentMethod {
  return {
    type: 'card',
    id: 'pm_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    userId,
    brand: validation.brand!,
    holder: dto.holder.trim(),
    last4: validation.last4,
    expiry: dto.expiry.trim(),
    isDefault: false,
    createdAt: now.toISOString()
  };
}

export function toKhqrMethod(dto: AddKhqrMethodDto, userId: string, now: Date = new Date()): KhqrPaymentMethod {
  return {
    type: 'khqr',
    id: 'pm_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    userId,
    bank: dto.bank,
    handle: dto.handle.trim(),
    isDefault: false,
    createdAt: now.toISOString()
  };
}

/**
 * Removes a method and guarantees the exactly-one-default invariant:
 * if the removed method was the default, the oldest remaining method
 * becomes default. Returns null when nothing matched.
 */
export function applyRemoveAndReassignDefault(methods: PaymentMethod[], methodId: string): PaymentMethod[] | null {
  const victim = methods.find(m => m.id === methodId);
  if (!victim) {
    return null;
  }
  const remaining = methods.filter(m => m.id !== methodId);
  if (victim.isDefault && remaining.length > 0 && !remaining.some(m => m.isDefault)) {
    return remaining.map(m => ({ ...m, isDefault: m === remaining[0] }));
  }
  return remaining;
}

export function ensureSingleDefault(methods: PaymentMethod[]): PaymentMethod[] {
  if (methods.length === 0 || methods.some(m => m.isDefault)) {
    return methods;
  }
  return methods.map(m => ({ ...m, isDefault: m === methods[0] }));
}

export type RedeemResult =
  | { ok: true; giftCard: GiftCard; updatedCards: GiftCard[]; amount: number }
  | { ok: false; reason: 'not_found' | 'already_redeemed' };

export function redeemGiftCard(cards: GiftCard[], code: string, userId: string, now: Date = new Date()): RedeemResult {
  const normalized = code.trim().toUpperCase();
  const card = cards.find(c => c.code === normalized);
  if (!card) {
    return { ok: false, reason: 'not_found' };
  }
  if (card.redeemedBy !== null) {
    return { ok: false, reason: 'already_redeemed' };
  }
  const redeemed: GiftCard = { ...card, redeemedBy: userId, redeemedAt: now.toISOString() };
  return {
    ok: true,
    giftCard: redeemed,
    updatedCards: cards.map(c => (c.code === redeemed.code ? redeemed : c)),
    amount: card.amount
  };
}

export function makeTransaction(userId: string, amount: number, source: WalletTransaction['source'], label: string, now: Date = new Date()): WalletTransaction {
  return {
    id: 'txn_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    userId,
    amount,
    source,
    label,
    createdAt: now.toISOString()
  };
}

export function methodDisplayName(method: PaymentMethod): string {
  if (method.type === 'card') {
    return `Credit Card (${method.brand === 'visa' ? 'Visa' : 'Mastercard'} \u2022\u2022\u2022\u2022 ${method.last4})`;
  }
  return `${method.bank} KHQR (${method.handle})`;
}
