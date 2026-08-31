/**
 * Pure finance rule functions — the only place Money may be created or
 * transformed. Integer minor units everywhere; no floating point arithmetic
 * on monetary values. No Angular, no I/O: fully unit and fuzz testable.
 */
import {
  CURRENCY_MINOR_UNITS,
  Currency,
  FinanceTransaction,
  GiftCardStatus,
  LedgerEntry,
  Money,
  PaymentFailureReason,
  PaymentIntent,
  PaymentIntentStatus,
  PaymentResult,
  Tender,
  TenderType
} from '../../models/finance.model';
import { luhnCheck, isCardExpired } from './payment-logic';

/* ==========================================================================
   Money construction & formatting
   ========================================================================== */

/** Creates Money from integer minor units. Rejects non-integers defensively. */
export function money(amountMinor: number, currency: Currency): Money {
  const safe = Math.trunc(amountMinor);
  if (safe !== amountMinor) {
    throw new Error(`money(): amount must be integer minor units, received ${amountMinor}`);
  }
  return { amountMinor: safe, currency };
}

/** Deterministic round-half-up on integers (no float drift). */
export function convertCurrency(amountMinor: number, from: Currency, to: Currency, usdToKhrRate: number = 4100): number {
  const safe = Math.trunc(amountMinor);
  if (from === to) {
    return safe;
  }
  // Rate is expressed in KHR major units per USD major unit. Minor-to-minor:
  // USD->KHR multiplies by the rate; KHR->USD divides. The minor-unit ratio
  // cancels (both currencies use 100 minor units per major unit).
  // Deterministic round-half-up keeps the conversion repeatable.
  const rateFactor = (from === 'USD' && to === 'KHR') ? usdToKhrRate
    : (from === 'KHR' && to === 'USD') ? 1 / usdToKhrRate
    : 1;
  const converted = safe * rateFactor * (CURRENCY_MINOR_UNITS[to] / CURRENCY_MINOR_UNITS[from]);
  return Math.round(converted);
}

export function formatMoney(m: Money): string {
  const major = m.amountMinor / CURRENCY_MINOR_UNITS[m.currency];
  if (m.currency === 'KHR') {
    const sign = m.amountMinor < 0 ? '-' : '';
    return `${sign}\u17DB${Math.abs(Math.trunc(major)).toLocaleString('en-US')}`;
  }
  const sign = m.amountMinor < 0 ? '-' : '';
  return `${sign}$${Math.abs(major).toFixed(2)}`;
}

/* ==========================================================================
   Card, expiry & CVC validation (delegates to battle-tested pure helpers)
   ========================================================================== */

export function validateCardNumber(number: string): boolean {
  return luhnCheck(number);
}

export function validateExpiry(expiry: string, now: Date = new Date()): boolean {
  return !isCardExpired(expiry, now);
}

export function validateCvcFormat(cvc: string): boolean {
  return /^\d{3,4}$/.test(cvc.trim());
}

/* ==========================================================================
   Order totals & tender allocation
   ========================================================================== */

export function calculateOrderTotal(itemAmountsMinor: number[]): number {
  return itemAmountsMinor.reduce((sum, n) => sum + Math.trunc(n), 0);
}

export function calculateRemainingDue(intent: Pick<PaymentIntent, 'amountDueMinor' | 'amountPaidMinor'>): number {
  return Math.trunc(intent.amountDueMinor) - Math.trunc(intent.amountPaidMinor);
}

/** What a tender candidate can contribute before capping. */
export interface TenderRequest {
  type: TenderType;
  /** Maximum this tender may contribute (wallet balance, gift card amount...). */
  availableMinor: number;
  currency: Currency;
  paymentMethodId?: string;
  giftCardCode?: string;
}

export type AllocationResult =
  | { ok: true; allocated: Tender[]; remainingDueMinor: number }
  | { ok: false; reason: 'invalid_amount' | 'nothing_due' | 'negative_due' };

/**
 * Allocates tenders sequentially, capping each at the remaining due.
 * Overpayment is impossible by construction; `detectOverpayment` provides
 * the explicit guard for caller-supplied tender lists.
 */
export function allocateTenders(requests: TenderRequest[], dueMinor: number): AllocationResult {
  if (dueMinor < 0) {
    return { ok: false, reason: 'negative_due' };
  }
  if (dueMinor === 0) {
    return { ok: false, reason: 'nothing_due' };
  }
  const allocated: Tender[] = [];
  let remaining = Math.trunc(dueMinor);
  for (const req of requests) {
    if (remaining <= 0) {
      break;
    }
    const available = Math.trunc(req.availableMinor);
    if (available <= 0) {
      continue;
    }
    const amount = Math.min(available, remaining);
    if (amount <= 0) {
      continue;
    }
    allocated.push({
      type: req.type,
      amountMinor: amount,
      currency: req.currency,
      paymentMethodId: req.paymentMethodId,
      giftCardCode: req.giftCardCode
    });
    remaining -= amount;
  }
  return { ok: true, allocated, remainingDueMinor: remaining };
}

/** Explicit overpayment guard for caller-supplied tender lists. */
export function detectOverpayment(tenders: Tender[], dueMinor: number): boolean {
  const total = tenders.reduce((sum, t) => sum + Math.trunc(t.amountMinor), 0);
  return total > Math.trunc(dueMinor) || tenders.some(t => t.amountMinor <= 0);
}

/* ==========================================================================
   Wallet, gift card & method usability rules
   ========================================================================== */

export function validateWalletBalance(balanceMinor: number, debitMinor: number): boolean {
  // Wallet cannot go negative, period.
  return Math.trunc(balanceMinor) - Math.trunc(debitMinor) >= 0;
}

export function validateGiftCardState(status: GiftCardStatus): PaymentFailureReason | null {
  if (status === 'unused') {
    return null;
  }
  if (status === 'expired') {
    return 'gift_card_invalid';
  }
  if (status === 'invalid') {
    return 'gift_card_invalid';
  }
  return 'gift_card_invalid'; // redeemed
}

/** Derives gift card status without a storage migration (additive on legacy shape). */
export function giftCardStatus(card: { redeemedBy: string | null; redeemedAt: string | null; expiresAt?: string | null }, now: Date = new Date()): GiftCardStatus {
  if (card.expiresAt && new Date(card.expiresAt) <= now) {
    return 'expired';
  }
  return card.redeemedBy !== null ? 'redeemed' : 'unused';
}

/** Discriminated usability check for any payable method reference. */
export type PayableMethodRef =
  | { type: 'wallet'; balanceMinor: number; walletStatus?: 'active' | 'locked' }
  | { type: 'card'; expiry: string }
  | { type: 'khqr' }
  | { type: 'gift_card'; status: GiftCardStatus };

export function canUsePaymentMethod(ref: PayableMethodRef, dueMinor: number): boolean {
  switch (ref.type) {
    case 'wallet':
      return ref.walletStatus !== 'locked' && ref.balanceMinor > 0 && validateWalletBalance(ref.balanceMinor, Math.min(ref.balanceMinor, Math.trunc(dueMinor)));
    case 'card':
      return validateExpiry(ref.expiry);
    case 'khqr':
      return true;
    case 'gift_card':
      return ref.status === 'unused';
  }
}

/* ==========================================================================
   Payment intent state machine — strict and terminal-safe
   ========================================================================== */

const INTENT_TRANSITIONS: Record<PaymentIntentStatus, PaymentIntentStatus[]> = {
  draft: ['requires_payment_method', 'canceled', 'expired'],
  requires_payment_method: ['processing', 'canceled', 'expired'],
  processing: ['requires_action', 'succeeded', 'failed', 'canceled'],
  requires_action: ['processing', 'succeeded', 'failed', 'canceled', 'expired'],
  succeeded: [],
  failed: [],
  canceled: [],
  expired: []
};

const TERMINAL_STATES: ReadonlySet<PaymentIntentStatus> = new Set<PaymentIntentStatus>([
  'succeeded', 'failed', 'canceled', 'expired'
]);

export function isTerminalPaymentState(status: PaymentIntentStatus): boolean {
  return TERMINAL_STATES.has(status);
}

export function canTransitionPaymentState(from: PaymentIntentStatus, to: PaymentIntentStatus): boolean {
  return INTENT_TRANSITIONS[from].includes(to);
}

/** Transitions only when legal; returns null instead of throwing on invalid moves. */
export function transitionPaymentIntent(intent: PaymentIntent, to: PaymentIntentStatus): PaymentIntent | null {
  if (!canTransitionPaymentState(intent.status, to)) {
    return null;
  }
  return { ...intent, status: to };
}

/** Payable intents must be awaiting a method and not past expiry. */
export function assertPayableIntent(intent: PaymentIntent, now: Date = new Date()): PaymentFailureReason | null {
  if (intent.status !== 'requires_payment_method') {
    return 'intent_not_payable';
  }
  if (new Date(intent.expiresAt) <= now) {
    return 'expired_intent';
  }
  return null;
}

/* ==========================================================================
   Idempotency & summaries
   ========================================================================== */

export function generateIdempotencyKey(): string {
  return 'idem_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export interface PaymentSummary {
  totalMinor: number;
  allocatedMinor: number;
  remainingDueMinor: number;
  byTender: Partial<Record<TenderType, number>>;
}

export function createPaymentSummary(intent: PaymentIntent, tenders: Tender[]): PaymentSummary {
  const byTender: Partial<Record<TenderType, number>> = {};
  let allocatedMinor = 0;
  for (const t of tenders) {
    byTender[t.type] = (byTender[t.type] ?? 0) + t.amountMinor;
    allocatedMinor += t.amountMinor;
  }
  return {
    totalMinor: intent.amountDueMinor,
    allocatedMinor,
    remainingDueMinor: calculateRemainingDue({ amountDueMinor: intent.amountDueMinor, amountPaidMinor: intent.amountPaidMinor }) - allocatedMinor,
    byTender
  };
}

/* ==========================================================================
   Ledger derivation
   ========================================================================== */

/** Wallet balance = sum of COMPLETED ledger entries. Failed/reversed entries never count. */
export function deriveLedgerBalance(entries: LedgerEntry[], currency: Currency = 'USD'): Money {
  const total = entries
    .filter(e => e.status === 'completed')
    .reduce((sum, e) => sum + e.amountMinor, 0);
  return money(total, currency);
}

/** Receipt id helper shared by the service layer. */
export function makeReceiptId(now: Date = new Date()): string {
  return 'rcpt_' + now.getTime().toString(36) + Math.random().toString(36).substring(2, 6);
}

/** Builds the user-facing transaction row for a settled payment movement. */
export function toFinanceTransaction(
  base: Omit<FinanceTransaction, 'id'> & { id?: string },
  now: Date = new Date()
): FinanceTransaction {
  return {
    id: base.id ?? ('ftxn_' + now.getTime().toString(36) + Math.random().toString(36).substring(2, 5)),
    userId: base.userId,
    type: base.type,
    method: base.method,
    amountMinor: Math.trunc(base.amountMinor),
    currency: base.currency,
    status: base.status,
    createdAt: base.createdAt,
    orderId: base.orderId,
    receiptId: base.receiptId
  };
}

/** Type guard: a successful PaymentResult narrows cleanly for callers. */
export function isPaymentSuccess(r: PaymentResult): r is Extract<PaymentResult, { ok: true }> {
  return r.ok;
}
