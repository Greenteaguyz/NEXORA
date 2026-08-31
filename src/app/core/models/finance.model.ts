/**
 * Finance domain models — the financial-system layer of NEXORA payments.
 *
 * All monetary amounts use INTEGER MINOR UNITS (cents for USD, sen for KHR)
 * wrapped in `Money`. Floating point arithmetic on money is prohibited:
 * only the pure functions in payment-finance-logic.ts may create or
 * transform Money values.
 *
 * These types extend — never replace — the legacy `payment.model.ts` layer
 * that existing UI consumes.
 */

/* ==========================================================================
   Money & Currency
   ========================================================================== */

export type Currency = 'USD' | 'KHR';

/** Integer minor units only. Never store or compute money as floats. */
export interface Money {
  amountMinor: number;
  currency: Currency;
}

/** Minor units per major unit (USD: 100 cents, KHR: 100 sen). */
export const CURRENCY_MINOR_UNITS: Record<Currency, number> = {
  USD: 100,
  KHR: 100
};

/* ==========================================================================
   Finance Payment Method taxonomy (superset of legacy 'card' | 'khqr')
   ========================================================================== */

export type FinancePaymentMethodType = 'card' | 'wallet' | 'khqr' | 'gift_card';

/* ==========================================================================
   Ledger — source of truth for every wallet balance movement
   ========================================================================== */

export type LedgerEntryType =
  | 'top_up'
  | 'purchase_debit'
  | 'refund_credit'
  | 'gift_card_redemption'
  | 'hold'
  | 'release'
  | 'fee';

export type LedgerEntryStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface LedgerEntry {
  id: string;
  userId: string;
  type: LedgerEntryType;
  /** Signed impact on the wallet in minor units (credit positive, debit negative). */
  amountMinor: number;
  currency: Currency;
  status: LedgerEntryStatus;
  /** Wallet balance in minor units immediately after this entry completed. */
  balanceAfterMinor: number;
  /** Cross-reference: intent id, order id, or gift card code. */
  reference: string;
  label: string;
  createdAt: string;
}

/* ==========================================================================
   Gift Cards (finance view; storage shape stays backward compatible)
   ========================================================================== */

export type GiftCardStatus = 'unused' | 'redeemed' | 'expired' | 'invalid';

/* ==========================================================================
   Payment Intents — strict, terminal-safe state machine
   ========================================================================== */

export type PaymentIntentStatus =
  | 'draft'
  | 'requires_payment_method'
  | 'processing'
  | 'requires_action'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'expired';

export interface PaymentIntent {
  id: string;
  orderId: string;
  userId: string;
  amountDueMinor: number;
  amountPaidMinor: number;
  currency: Currency;
  status: PaymentIntentStatus;
  createdAt: string;
  expiresAt: string;
  idempotencyKey: string;
}

/* ==========================================================================
   Tenders & Attempts — how an intent is fulfilled
   ========================================================================== */

export type TenderType = 'wallet' | 'card' | 'khqr' | 'gift_card';

export interface Tender {
  type: TenderType;
  /** Capped amount this tender contributes in minor units (never exceeds remaining due). */
  amountMinor: number;
  currency: Currency;
  paymentMethodId?: string;
  giftCardCode?: string;
}

export type PaymentAttemptStatus = 'processing' | 'succeeded' | 'failed';

export type PaymentFailureReason =
  | 'insufficient_wallet'
  | 'card_declined'
  | 'gift_card_invalid'
  | 'overpayment'
  | 'no_tender'
  | 'intent_not_payable'
  | 'expired_intent';

export interface PaymentAttempt {
  id: string;
  paymentIntentId: string;
  tenders: Tender[];
  status: PaymentAttemptStatus;
  failureReason: PaymentFailureReason | null;
  createdAt: string;
}

export type PaymentResult =
  | { ok: true; intent: PaymentIntent; attempt: PaymentAttempt; receiptId: string }
  | { ok: false; intent: PaymentIntent; attempt: PaymentAttempt; failureReason: PaymentFailureReason };

/* ==========================================================================
   Transactions — user-facing financial history
   ========================================================================== */

export type FinanceTransactionType = 'purchase' | 'top_up' | 'refund' | 'gift_card_redemption';

export interface FinanceTransaction {
  id: string;
  userId: string;
  type: FinanceTransactionType;
  method: string;
  amountMinor: number;
  currency: Currency;
  status: LedgerEntryStatus;
  createdAt: string;
  orderId: string | null;
  receiptId: string | null;
}
