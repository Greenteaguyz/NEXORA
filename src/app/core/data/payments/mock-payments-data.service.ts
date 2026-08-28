import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  AddMethodResult,
  PaymentsDataService,
  RedeemCodeResult,
  TopUpResult,
  WalletSnapshot
} from '../tokens';
import { AddPaymentMethodDto, GiftCard, PaymentMethod, Wallet, WalletTransaction } from '../../models/payment.model';
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

export const MAX_TOP_UP_USD = 500;

@Injectable({
  providedIn: 'root'
})
export class MockPaymentsDataService implements PaymentsDataService {
  private readonly METHODS_KEY = 'payment_methods';
  private readonly WALLETS_KEY = 'wallet_balances';
  private readonly TXNS_KEY = 'wallet_transactions';
  private readonly GIFTS_KEY = 'gift_cards';

  private localStore = inject(LocalStoreService);

  private methods: PaymentMethod[] = [];
  private wallets: Wallet[] = [];
  private transactions: WalletTransaction[] = [];
  private giftCards: GiftCard[] = [];

  constructor() {
    this.initData();
  }

  private initData(): void {
    this.methods = this.healDefaults(this.localStore.getItem<PaymentMethod[]>(this.METHODS_KEY) ?? [...SEED_PAYMENT_METHODS]);
    this.wallets = this.localStore.getItem<Wallet[]>(this.WALLETS_KEY) ?? [...SEED_WALLETS];
    this.transactions = this.localStore.getItem<WalletTransaction[]>(this.TXNS_KEY) ?? [...SEED_WALLET_TRANSACTIONS];
    this.giftCards = this.localStore.getItem<GiftCard[]>(this.GIFTS_KEY) ?? [...SEED_GIFT_CARDS];
    this.localStore.setItem(this.METHODS_KEY, this.methods);
    this.localStore.setItem(this.WALLETS_KEY, this.wallets);
    this.localStore.setItem(this.TXNS_KEY, this.transactions);
    this.localStore.setItem(this.GIFTS_KEY, this.giftCards);
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
    wallet.balance = Math.round((wallet.balance + amount) * 100) / 100;
    this.transactions = [transaction, ...this.transactions.filter(t => t.id !== transaction.id)];
    this.localStore.setItem(this.WALLETS_KEY, this.wallets);
    this.localStore.setItem(this.TXNS_KEY, this.transactions);
    return wallet;
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
}
