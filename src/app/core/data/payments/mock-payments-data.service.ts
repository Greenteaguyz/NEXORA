import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  AddMethodResult,
  CreatePaymentIntentRequest,
  FinanceWallet,
  PaymentsDataService,
  ProcessPaymentRequest,
  RedeemCodeResult,
  TopUpResult,
  TopUpWalletRequest,
  TopUpWalletResult,
  WalletSnapshot
} from '../tokens';
import { AddPaymentMethodDto, GiftCard, PaymentMethod, Wallet, WalletTransaction } from '../../models/payment.model';
import {
  Currency,
  FinanceTransaction,
  LedgerEntry,
  PaymentAttempt,
  PaymentIntent,
  PaymentResult,
  Tender
} from '../../models/finance.model';
import { LocalStoreService } from '../../persistence/local-store.service';
import {
  SEED_GIFT_CARDS,
  SEED_PAYMENT_METHODS,
  SEED_WALLETS,
  SEED_WALLET_TRANSACTIONS
} from './payments.seed';
import {
  applyRemoveAndReassignDefault,
  ensureSingleDefault,
  isDuplicateKhqr,
  makeTransaction,
  methodDisplayName,
  redeemGiftCard,
  toCardMethod,
  toKhqrMethod,
  validateCardInput
} from './payment-logic';
import {
  allocateTenders,
  assertPayableIntent,
  calculateRemainingDue,
  canTransitionPaymentState,
  deriveLedgerBalance,
  detectOverpayment,
  generateIdempotencyKey,
  giftCardStatus,
  makeReceiptId,
  transitionPaymentIntent,
  validateWalletBalance
} from './payment-finance-logic';

export const MAX_TOP_UP_USD = 500;
export const MAX_TOP_UP_MINOR = MAX_TOP_UP_USD * 100;
/** Deterministic decline rule (Stripe-style test PAN): last4 0002 always declines. */
export const DECLINE_LAST4 = '0002';
const INTENT_TTL_DEFAULT_MS = 15 * 60 * 1000;

@Injectable({
  providedIn: 'root'
})
export class MockPaymentsDataService implements PaymentsDataService {
  private readonly METHODS_KEY = 'payment_methods';
  private readonly WALLETS_KEY = 'wallet_balances';
  private readonly TXNS_KEY = 'wallet_transactions';
  private readonly GIFTS_KEY = 'gift_cards';
  private readonly LEDGER_KEY = 'wallet_ledger';
  private readonly INTENTS_KEY = 'finance_intents';
  private readonly FTXNS_KEY = 'finance_transactions';
  private readonly IDEMPOTENCY_KEY = 'finance_idempotency';

  private localStore = inject(LocalStoreService);

  private methods: PaymentMethod[] = [];
  private wallets: Wallet[] = [];
  private transactions: WalletTransaction[] = [];
  private giftCards: GiftCard[] = [];
  private ledger: LedgerEntry[] = [];
  private intents: PaymentIntent[] = [];
  private financeTransactions: FinanceTransaction[] = [];
  private idempotencyResults: Record<string, PaymentResult> = {};

  constructor() {
    this.initData();
  }

  private initData(): void {
    let loadedMethods = this.localStore.getItem<PaymentMethod[]>(this.METHODS_KEY) ?? [...SEED_PAYMENT_METHODS];
    // Self-healing migration: Ensure pm_bob_khqr is assigned to usr_alice, and no KHQR exists for usr_bob
    let methodsChanged = false;
    loadedMethods = loadedMethods.map(m => {
      if (m.id === 'pm_bob_khqr' && m.userId === 'usr_bob') {
        methodsChanged = true;
        return { ...m, userId: 'usr_alice', handle: 'alicevance@aba' };
      }
      return m;
    });
    const cleanedMethods = loadedMethods.filter(m => !(m.userId === 'usr_bob' && m.type === 'khqr'));
    if (cleanedMethods.length !== loadedMethods.length) {
      methodsChanged = true;
      loadedMethods = cleanedMethods;
    }
    this.methods = this.healDefaults(loadedMethods);

    this.wallets = this.localStore.getItem<Wallet[]>(this.WALLETS_KEY) ?? [...SEED_WALLETS];

    let loadedTxns = this.localStore.getItem<WalletTransaction[]>(this.TXNS_KEY) ?? [...SEED_WALLET_TRANSACTIONS];
    // Cleanse any legacy buyer transaction mentioning ABA KHQR
    loadedTxns = loadedTxns.map(t => {
      if (t.userId === 'usr_bob' && t.label.includes('ABA KHQR')) {
        return { ...t, label: 'Wallet top-up · Visa •••• 1881' };
      }
      return t;
    });
    this.transactions = loadedTxns;

    this.giftCards = this.localStore.getItem<GiftCard[]>(this.GIFTS_KEY) ?? [...SEED_GIFT_CARDS];
    this.ledger = this.localStore.getItem<LedgerEntry[]>(this.LEDGER_KEY) ?? this.buildSeedLedger();
    this.intents = this.localStore.getItem<PaymentIntent[]>(this.INTENTS_KEY) ?? [];
    this.financeTransactions = this.localStore.getItem<FinanceTransaction[]>(this.FTXNS_KEY) ?? [];
    this.idempotencyResults = this.localStore.getItem<Record<string, PaymentResult>>(this.IDEMPOTENCY_KEY) ?? {};
    this.localStore.setItem(this.METHODS_KEY, this.methods);
    this.localStore.setItem(this.WALLETS_KEY, this.wallets);
    this.localStore.setItem(this.TXNS_KEY, this.transactions);
    this.localStore.setItem(this.GIFTS_KEY, this.giftCards);
    this.localStore.setItem(this.LEDGER_KEY, this.ledger);
    this.localStore.setItem(this.INTENTS_KEY, this.intents);
    this.localStore.setItem(this.FTXNS_KEY, this.financeTransactions);
    this.localStore.setItem(this.IDEMPOTENCY_KEY, this.idempotencyResults);
  }

  /**
   * Seeds the ledger from legacy wallet transactions plus one reconciliation
   * entry per user so the ledger-derived balance matches the seeded wallet
   * exactly (legacy seed balances are not sums of their seed transactions).
   */
  private buildSeedLedger(): LedgerEntry[] {
    const entries: LedgerEntry[] = [];
    const now = new Date();
    for (const wallet of this.wallets) {
      const seedTxns = SEED_WALLET_TRANSACTIONS.filter(t => t.userId === wallet.userId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      let running = 0;
      for (const t of seedTxns) {
        const amountMinor = Math.round(t.amount * 100);
        running += amountMinor;
        entries.push({
          id: 'led_' + t.id,
          userId: t.userId,
          type: t.source === 'purchase' ? 'purchase_debit' : t.source === 'gift_card' ? 'gift_card_redemption' : 'top_up',
          amountMinor,
          currency: 'USD',
          status: 'completed',
          balanceAfterMinor: running,
          reference: t.id,
          label: t.label,
          createdAt: t.createdAt
        });
      }
      const targetMinor = Math.round(wallet.balance * 100);
      if (running !== targetMinor) {
        entries.push({
          id: 'led_seed_reconcile_' + wallet.userId,
          userId: wallet.userId,
          type: 'top_up',
          amountMinor: targetMinor - running,
          currency: 'USD',
          status: 'completed',
          balanceAfterMinor: targetMinor,
          reference: 'seed_reconciliation',
          label: 'Opening balance',
          createdAt: now.toISOString()
        });
      }
    }
    return entries;
  }

  /** Heals the exactly-one-default invariant per user (defensive read of stored data). */
  private healDefaults(methods: PaymentMethod[]): PaymentMethod[] {
    const byUser = new Map<string, PaymentMethod[]>();
    for (const m of methods) {
      const list = byUser.get(m.userId) ?? [];
      list.push(m);
      byUser.set(m.userId, list);
    }
    const healed: PaymentMethod[] = [];
    for (const list of byUser.values()) {
      healed.push(...ensureSingleDefault(list));
    }
    return healed;
  }

  private persistMethods(): void {
    this.localStore.setItem(this.METHODS_KEY, this.methods);
  }

  private walletFor(userId: string): Wallet {
    let wallet = this.wallets.find(w => w.userId === userId);
    if (!wallet) {
      wallet = { userId, balance: 0 };
      this.wallets.push(wallet);
      this.localStore.setItem(this.WALLETS_KEY, this.wallets);
    }
    return wallet;
  }

  private creditWallet(userId: string, amount: number, transaction: WalletTransaction): Wallet {
    const wallet = this.walletFor(userId);
    this.transactions = [transaction, ...this.transactions.filter(t => t.id !== transaction.id)];
    // Ledger is the source of truth: every legacy credit also lands here.
    this.appendLedgerEntry(
      userId,
      transaction.source === 'top_up' ? 'top_up' : transaction.source === 'gift_card' ? 'gift_card_redemption' : 'purchase_debit',
      Math.round(amount * 100),
      transaction.id,
      transaction.label
    );
    this.localStore.setItem(this.TXNS_KEY, this.transactions);
    this.persistFinance();
    return wallet;
  }

  /* ==========================================================================
     Finance layer — ledger-backed wallet, intents, tenders, idempotency
     ========================================================================== */

  private ledgerFor(userId: string): LedgerEntry[] {
    return this.ledger.filter(e => e.userId === userId);
  }

  /** Balance derived strictly from COMPLETED entries (failed/reversed never count). */
  private userBalanceMinor(userId: string): number {
    return this.ledgerFor(userId)
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + e.amountMinor, 0);
  }

  private appendLedgerEntry(
    userId: string,
    type: LedgerEntry['type'],
    signedAmountMinor: number,
    reference: string,
    label: string,
    now: Date = new Date(),
    status: LedgerEntry['status'] = 'completed'
  ): LedgerEntry {
    const balanceAfterMinor = status === 'completed'
      ? this.userBalanceMinor(userId) + signedAmountMinor
      : this.userBalanceMinor(userId);
    const entry: LedgerEntry = {
      id: 'led_' + now.getTime().toString(36) + Math.random().toString(36).substring(2, 6),
      userId,
      type,
      amountMinor: signedAmountMinor,
      currency: 'USD',
      status,
      balanceAfterMinor,
      reference,
      label,
      createdAt: now.toISOString()
    };
    this.ledger = [...this.ledger, entry];
    return entry;
  }

  /** Keeps the legacy float-USD wallet store in lockstep with the ledger. */
  private syncLegacyWallet(userId: string): Wallet {
    const wallet = this.walletFor(userId);
    wallet.balance = this.userBalanceMinor(userId) / 100;
    this.localStore.setItem(this.WALLETS_KEY, this.wallets);
    return wallet;
  }

  private persistFinance(): void {
    this.localStore.setItem(this.LEDGER_KEY, this.ledger);
    this.localStore.setItem(this.INTENTS_KEY, this.intents);
    this.localStore.setItem(this.FTXNS_KEY, this.financeTransactions);
    this.localStore.setItem(this.IDEMPOTENCY_KEY, this.idempotencyResults);
    this.localStore.setItem(this.GIFTS_KEY, this.giftCards);
    this.localStore.setItem(this.WALLETS_KEY, this.wallets);
  }

  getFinanceWallet(userId: string): Observable<FinanceWallet> {
    const snapshot: FinanceWallet = {
      userId,
      balanceMinor: this.userBalanceMinor(userId),
      currency: 'USD',
      status: 'active'
    };
    return of(snapshot).pipe(delay(120));
  }

  getLedger(userId: string): Observable<LedgerEntry[]> {
    const entries = this.ledgerFor(userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return of(entries).pipe(delay(120));
  }

  createPaymentIntent(request: CreatePaymentIntentRequest): Observable<PaymentIntent> {
    if (!Number.isInteger(request.amountMinor) || request.amountMinor <= 0) {
      throw new Error(`createPaymentIntent: amountMinor must be a positive integer, received ${request.amountMinor}`);
    }
    const now = new Date();
    const intent: PaymentIntent = {
      id: 'pi_' + now.getTime().toString(36) + Math.random().toString(36).substring(2, 6),
      orderId: request.orderId,
      userId: request.userId,
      amountDueMinor: request.amountMinor,
      amountPaidMinor: 0,
      currency: request.currency,
      status: 'requires_payment_method',
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + (request.ttlMs ?? INTENT_TTL_DEFAULT_MS)).toISOString(),
      idempotencyKey: request.idempotencyKey || generateIdempotencyKey()
    };
    this.intents = [...this.intents, intent];
    this.persistFinance();
    return of(intent).pipe(delay(120));
  }

  getPaymentIntent(intentId: string): Observable<PaymentIntent | null> {
    return of(this.intents.find(i => i.id === intentId) ?? null).pipe(delay(120));
  }

  processPayment(request: ProcessPaymentRequest): Observable<PaymentResult> {
    // Idempotency: the same key replays the original result with no side effects.
    const cached = this.idempotencyResults[request.idempotencyKey];
    if (cached) {
      return of(cached).pipe(delay(120));
    }
    const result = this.executePayment(request);
    this.idempotencyResults[request.idempotencyKey] = result;
    this.persistFinance();
    return of(result).pipe(delay(120));
  }

  private executePayment(request: ProcessPaymentRequest): PaymentResult {
    const now = new Date();
    const attemptId = 'att_' + now.getTime().toString(36) + Math.random().toString(36).substring(2, 5);
    const baseAttempt: PaymentAttempt = {
      id: attemptId,
      paymentIntentId: request.intentId,
      tenders: [],
      status: 'processing',
      failureReason: null,
      createdAt: now.toISOString()
    };

    const intent = this.intents.find(i => i.id === request.intentId);
    if (!intent) {
      const ghost: PaymentIntent = {
        id: request.intentId,
        orderId: '',
        userId: request.userId,
        amountDueMinor: 0,
        amountPaidMinor: 0,
        currency: 'USD',
        status: 'draft',
        createdAt: now.toISOString(),
        expiresAt: now.toISOString(),
        idempotencyKey: request.idempotencyKey
      };
      return { ok: false, intent: ghost, attempt: { ...baseAttempt, status: 'failed', failureReason: 'intent_not_payable' }, failureReason: 'intent_not_payable' };
    }

    const failure = (reason: PaymentAttempt['failureReason'] & string, tenders: Tender[]): PaymentResult => {
      // Audit-only failed entry: excluded from balance derivation, preserves the attempt trail.
      this.appendLedgerEntry(request.userId, 'purchase_debit', 0, request.intentId, `Failed payment attempt (${reason})`, now, 'failed');
      return {
        ok: false,
        intent,
        attempt: { ...baseAttempt, tenders, status: 'failed', failureReason: reason as never },
        failureReason: reason as never
      };
    };

    const notPayable = assertPayableIntent(intent, now);
    if (notPayable) {
      return failure(notPayable, []);
    }

    if (request.tenders.length === 0) {
      return failure('no_tender', []);
    }

    if (request.tenders.some(t => t.currency !== intent.currency)) {
      return failure('no_tender', request.tenders);
    }

    if (detectOverpayment(request.tenders, calculateRemainingDue(intent))) {
      return failure('overpayment', request.tenders);
    }

    const remainingDue = calculateRemainingDue(intent);
    const allocation = allocateTenders(
      request.tenders.map(t => ({
        type: t.type,
        availableMinor: t.amountMinor,
        currency: t.currency,
        paymentMethodId: t.paymentMethodId,
        giftCardCode: t.giftCardCode
      })),
      remainingDue
    );
    if (!allocation.ok) {
      return failure('no_tender', request.tenders);
    }
    if (allocation.remainingDueMinor > 0) {
      return failure('no_tender', allocation.allocated);
    }

    // --- Tender-specific validation (no writes happen before this point) ---
    let walletCommittedMinor = 0;
    for (const tender of allocation.allocated) {
      if (tender.type === 'wallet') {
        const balanceMinor = this.userBalanceMinor(request.userId);
        if (balanceMinor - walletCommittedMinor < tender.amountMinor) {
          return failure('insufficient_wallet', allocation.allocated);
        }
        walletCommittedMinor += tender.amountMinor;
      } else if (tender.type === 'gift_card') {
        const code = (tender.giftCardCode ?? '').trim().toUpperCase();
        const card = this.giftCards.find(c => c.code === code);
        if (!card || giftCardStatus(card, now) !== 'unused' || tender.amountMinor > Math.round(card.amount * 100)) {
          return failure('gift_card_invalid', allocation.allocated);
        }
      } else {
        const method = this.methods.find(m => m.id === tender.paymentMethodId && m.userId === request.userId);
        if (!method) {
          return failure('no_tender', allocation.allocated);
        }
        if (method.type === 'card' && method.last4 === DECLINE_LAST4) {
          return failure('card_declined', allocation.allocated);
        }
      }
    }

    // --- Success path: strict transitions, ledger writes, receipts ---
    const processing = transitionPaymentIntent(intent, 'processing');
    const settled = processing ? transitionPaymentIntent(processing, 'succeeded') : null;
    if (!settled || !canTransitionPaymentState('processing', 'succeeded')) {
      return failure('intent_not_payable', allocation.allocated);
    }

    const totalPaidMinor = allocation.allocated.reduce((sum, t) => sum + t.amountMinor, 0);
    const succeededIntent: PaymentIntent = { ...settled, amountPaidMinor: totalPaidMinor };
    this.intents = this.intents.map(i => (i.id === succeededIntent.id ? succeededIntent : i));

    // Wallet debit only for wallet tenders; gift/card/KHQR tenders bypass the wallet.
    if (walletCommittedMinor > 0) {
      this.appendLedgerEntry(
        request.userId,
        'purchase_debit',
        -walletCommittedMinor,
        succeededIntent.id,
        `Purchase debit · order ${succeededIntent.orderId}`,
        now
      );
      this.syncLegacyWallet(request.userId);
    }

    // Mark any gift card tender as redeemed (mock simplification: full redemption).
    for (const tender of allocation.allocated) {
      if (tender.type === 'gift_card' && tender.giftCardCode) {
        this.giftCards = this.giftCards.map(c =>
          c.code === tender.giftCardCode ? { ...c, redeemedBy: request.userId, redeemedAt: now.toISOString() } : c
        );
      }
    }

    const receiptId = makeReceiptId(now);
    const methodSummary = allocation.allocated
      .map(t => {
        if (t.type === 'wallet') { return 'NEXORA Wallet'; }
        if (t.type === 'gift_card') { return `Gift card ${t.giftCardCode}`; }
        const m = this.methods.find(mm => mm.id === t.paymentMethodId);
        return m ? methodDisplayName(m) : t.type.toUpperCase();
      })
      .join(' + ');

    const purchaseTxn: FinanceTransaction = {
      id: 'ftxn_' + now.getTime().toString(36) + Math.random().toString(36).substring(2, 5),
      userId: request.userId,
      type: 'purchase',
      method: methodSummary,
      amountMinor: totalPaidMinor,
      currency: succeededIntent.currency,
      status: 'completed',
      createdAt: now.toISOString(),
      orderId: succeededIntent.orderId,
      receiptId
    };
    this.financeTransactions = [purchaseTxn, ...this.financeTransactions];

    return { ok: true, intent: succeededIntent, attempt: { ...baseAttempt, tenders: allocation.allocated, status: 'succeeded', failureReason: null }, receiptId };
  }

  topUpWallet(request: TopUpWalletRequest): Observable<TopUpWalletResult> {
    const now = new Date();
    if (!Number.isInteger(request.amountMinor) || request.amountMinor <= 0 || request.amountMinor > MAX_TOP_UP_MINOR) {
      const invalid: TopUpWalletResult = { ok: false, reason: 'invalid_amount' };
      return of(invalid).pipe(delay(120));
    }
    const method = this.methods.find(m => m.id === request.methodId && m.userId === request.userId);
    if (!method) {
      const notFound: TopUpWalletResult = { ok: false, reason: 'method_not_found' };
      return of(notFound).pipe(delay(120));
    }
    if (method.type !== 'card') {
      const notCard: TopUpWalletResult = { ok: false, reason: 'invalid_method_type' as any };
      return of(notCard).pipe(delay(120));
    }

    const entry = this.appendLedgerEntry(
      request.userId,
      'top_up',
      request.amountMinor,
      request.methodId,
      `Wallet top-up · ${methodDisplayName(method)}`,
      now
    );
    const wallet = this.syncLegacyWallet(request.userId);
    const transaction: FinanceTransaction = {
      id: 'ftxn_' + now.getTime().toString(36) + Math.random().toString(36).substring(2, 5),
      userId: request.userId,
      type: 'top_up',
      method: methodDisplayName(method),
      amountMinor: request.amountMinor,
      currency: 'USD',
      status: 'completed',
      createdAt: now.toISOString(),
      orderId: null,
      receiptId: null
    };
    this.financeTransactions = [transaction, ...this.financeTransactions];
    this.persistFinance();

    const snapshot: FinanceWallet = { userId: request.userId, balanceMinor: entry.balanceAfterMinor, currency: 'USD', status: 'active' };
    const result: TopUpWalletResult = { ok: true, wallet: snapshot, entry, transaction };
    return of(result).pipe(delay(120));
  }

  getFinanceTransactions(userId: string): Observable<FinanceTransaction[]> {
    const txns = this.financeTransactions.filter(t => t.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return of(txns).pipe(delay(120));
  }

  getMethods(userId: string): Observable<PaymentMethod[]> {
    return of(this.methods.filter(m => m.userId === userId));
  }

  addMethod(userId: string, dto: AddPaymentMethodDto): Observable<AddMethodResult> {
    const userMethods = this.methods.filter(m => m.userId === userId);

    let method: PaymentMethod;
    if (dto.type === 'card') {
      const validation = validateCardInput(dto, userMethods);
      if (!validation.valid) {
        return of({ ok: false, errors: validation.errors });
      }
      method = toCardMethod(dto, userId, validation);
    } else {
      if (!dto.handle || dto.handle.trim().length < 3) {
        return of({ ok: false, errors: ['Enter your bank handle (e.g. name@aba)'] });
      }
      if (isDuplicateKhqr(userMethods, dto)) {
        return of({ ok: false, errors: ['This KHQR link is already saved'] });
      }
      method = toKhqrMethod(dto, userId);
    }

    if (userMethods.length === 0) {
      method = { ...method, isDefault: true };
    }
    this.methods = [...this.methods, method];
    this.persistMethods();
    return of({ ok: true, method });
  }

  removeMethod(userId: string, methodId: string): Observable<PaymentMethod[]> {
    const userMethods = this.methods.filter(m => m.userId === userId);
    const updated = applyRemoveAndReassignDefault(userMethods, methodId);
    if (updated !== null) {
      this.methods = [...this.methods.filter(m => m.userId !== userId), ...updated];
      this.persistMethods();
    }
    return of(updated ?? userMethods);
  }

  setDefaultMethod(userId: string, methodId: string): Observable<PaymentMethod[]> {
    const updated = this.methods.map(m =>
      m.userId === userId ? { ...m, isDefault: m.id === methodId } : m
    );
    this.methods = updated;
    this.persistMethods();
    return of(updated.filter(m => m.userId === userId));
  }

  getWalletSnapshot(userId: string): Observable<WalletSnapshot> {
    const wallet = this.walletFor(userId);
    const transactions = this.transactions
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return of({ wallet, transactions });
  }

  topUp(userId: string, amount: number, methodId: string): Observable<TopUpResult> {
    const method = this.methods.find(m => m.id === methodId && m.userId === userId);
    if (!method) {
      throw new Error(`MockPaymentsDataService: unknown method ${methodId} for user ${userId}`);
    }
    if (method.type !== 'card') {
      throw new Error(`MockPaymentsDataService: top-up allowed strictly via card, received ${method.type}`);
    }
    const safeAmount = Math.min(Math.max(Math.round(amount * 100) / 100, 0), MAX_TOP_UP_USD);
    const transaction = makeTransaction(userId, safeAmount, 'top_up', `Wallet top-up · ${methodDisplayName(method)}`);
    const wallet = this.creditWallet(userId, safeAmount, transaction);
    return of({ wallet, transaction });
  }

  getGiftCards(): Observable<GiftCard[]> {
    return of(this.giftCards);
  }

  redeemGiftCode(userId: string, code: string): Observable<RedeemCodeResult> {
    const result = redeemGiftCard(this.giftCards, code, userId);
    if (result.ok === false) {
      return of(result);
    }
    this.giftCards = result.updatedCards;
    this.localStore.setItem(this.GIFTS_KEY, this.giftCards);
    const transaction = makeTransaction(userId, result.amount, 'gift_card', `Gift card ${result.giftCard.code} redeemed`);
    const wallet = this.creditWallet(userId, result.amount, transaction);
    return of({ ok: true, amount: result.amount, balance: wallet.balance, transaction });
  }

  refundWallet(userId: string, amountMinor: number, reference: string): Observable<FinanceWallet> {
    const now = new Date();
    if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
      throw new Error(`refundWallet: amountMinor must be a positive integer, received ${amountMinor}`);
    }
    const entry = this.appendLedgerEntry(
      userId,
      'refund_credit',
      amountMinor,
      reference,
      `Purchase revert · ${reference}`,
      now
    );
    const wallet = this.syncLegacyWallet(userId);

    const txn: FinanceTransaction = {
      id: 'ftxn_' + now.getTime().toString(36) + Math.random().toString(36).substring(2, 5),
      userId,
      type: 'refund',
      method: 'NEXORA Store Wallet',
      amountMinor,
      currency: 'USD',
      status: 'completed',
      createdAt: now.toISOString(),
      orderId: null,
      receiptId: null
    };
    this.financeTransactions = [txn, ...this.financeTransactions];
    this.persistFinance();

    const snapshot: FinanceWallet = { userId, balanceMinor: entry.balanceAfterMinor, currency: 'USD', status: 'active' };
    return of(snapshot).pipe(delay(120));
  }

  recordRevenueSplit(
    orderId: string,
    gameId: string,
    gameTitle: string,
    price: number,
    ownerId: string,
    buyerId: string
  ): Observable<{ devEarnedMinor: number; platformFeeMinor: number }> {
    const now = new Date();
    const totalMinor = Math.round(price * 100);
    if (totalMinor <= 0) {
      return of({ devEarnedMinor: 0, platformFeeMinor: 0 });
    }

    // Exact integer minor unit split (90% developer, 10% platform commission)
    const devEarnedMinor = Math.round(totalMinor * 0.90);
    const platformFeeMinor = totalMinor - devEarnedMinor;

    // 1. Credit developer wallet and record royalty ledger entry
    const devEntry = this.appendLedgerEntry(
      ownerId,
      'top_up',
      devEarnedMinor,
      orderId,
      `Game sale royalty · ${gameTitle} (90%)`,
      now
    );
    this.syncLegacyWallet(ownerId);

    // Also record legacy wallet transaction for developer
    const devTxn = makeTransaction(
      ownerId,
      devEarnedMinor / 100,
      'top_up',
      `Game sale royalty · ${gameTitle} (90%)`
    );
    this.transactions = [devTxn, ...this.transactions];
    this.localStore.setItem(this.TXNS_KEY, this.transactions);

    // 2. Record 10% platform commission fee into the platform company ledger
    this.appendLedgerEntry(
      'platform_treasury',
      'fee',
      platformFeeMinor,
      orderId,
      `Platform commission (10%) · ${gameTitle}`,
      now
    );

    // Record developer financial transaction audit record
    const fTxn: FinanceTransaction = {
      id: 'ftxn_' + now.getTime().toString(36) + Math.random().toString(36).substring(2, 5),
      userId: ownerId,
      type: 'top_up',
      method: 'Game Royalty Split',
      amountMinor: devEarnedMinor,
      currency: 'USD',
      status: 'completed',
      createdAt: now.toISOString(),
      orderId,
      receiptId: 'rcpt_' + orderId
    };
    this.financeTransactions = [fTxn, ...this.financeTransactions];
    this.persistFinance();

    return of({ devEarnedMinor, platformFeeMinor });
  }
}

