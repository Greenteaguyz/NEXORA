import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Game, CreateGameDto, UpdateGameDto } from '../models/game.model';
import { LibraryEntry } from '../models/library-entry.model';
import { Order } from '../models/order.model';
import { User } from '../models/user.model';
import { WishlistEntry } from '../models/wishlist-entry.model';
import { AddPaymentMethodDto, GiftCard, PaymentMethod, Wallet, WalletTransaction } from '../models/payment.model';
import {
  Currency,
  FinanceTransaction,
  LedgerEntry,
  PaymentIntent,
  PaymentResult,
  Tender
} from '../models/finance.model';

/* ==========================================================================
   1. Games Data Service & Injection Token
   ========================================================================== */
export interface GameFilters {
  tag?: string;
  search?: string;
}

export interface GamesDataService {
  getGames(filters?: GameFilters): Observable<Game[]>;
  getGameById(id: string): Observable<Game | undefined>;
  getGamesByOwnerId(ownerId: string): Observable<Game[]>;
  createGame(dto: CreateGameDto, ownerId: string): Observable<Game>;
  updateGame(id: string, dto: UpdateGameDto): Observable<Game>;
  deleteGame(id: string): Observable<void>;
  restoreGame?(id: string): Observable<Game>;
  permanentlyDeleteGame?(id: string): Observable<void>;
  emptyRecycleBin?(ownerId: string): Observable<void>;
  resetToDefaultSeed(): Observable<void>;
}

export const GAMES_DATA = new InjectionToken<GamesDataService>('GAMES_DATA');

/* ==========================================================================
   2. Library Data Service & Injection Token
   ========================================================================== */
export interface LibraryDataService {
  getLibrary(userId: string): Observable<LibraryEntry[]>;
  addToLibrary(userId: string, gameId: string, orderId?: string): Observable<LibraryEntry>;
  removeFromLibrary(userId: string, gameId: string): Observable<void>;
  isOwned(userId: string, gameId: string): Observable<boolean>;
}

export const LIBRARY_DATA = new InjectionToken<LibraryDataService>('LIBRARY_DATA');

/* ==========================================================================
   3. Orders Data Service & Injection Token
   ========================================================================== */
export interface OrdersDataService {
  createOrder(userId: string, gameId: string, price: number, paymentMethod?: string): Observable<Order>;
  getOrders(userId: string): Observable<Order[]>;
  getAllOrders?(): Observable<Order[]>;
  /** Confirmed → refunded (idempotent; terminal orders are returned unchanged). */
  revertOrder(orderId: string): Observable<Order>;
}

export const ORDERS_DATA = new InjectionToken<OrdersDataService>('ORDERS_DATA');

/* ==========================================================================
   4. Users Data Service & Injection Token
   ========================================================================== */
export interface UsersDataService {
  getUser(id: string): Observable<User | undefined>;
  getUserByEmail(email: string): Observable<User | undefined>;
  updateUser(id: string, partial: Partial<User>): Observable<User>;
}

export const USERS_DATA = new InjectionToken<UsersDataService>('USERS_DATA');

/* ==========================================================================
   5. Wishlist Data Service & Injection Token
   ========================================================================== */
export interface WishlistDataService {
  getWishlist(userId: string): Observable<WishlistEntry[]>;
  addToWishlist(userId: string, gameId: string): Observable<WishlistEntry>;
  removeFromWishlist(userId: string, gameId: string): Observable<void>;
  isWishlisted(userId: string, gameId: string): Observable<boolean>;
}

export const WISHLIST_DATA = new InjectionToken<WishlistDataService>('WISHLIST_DATA');

/* ==========================================================================
   6. Payments Data Service & Injection Token
   ========================================================================== */
export type AddMethodResult =
  | { ok: true; method: PaymentMethod }
  | { ok: false; errors: string[] };

export type RedeemCodeResult =
  | { ok: true; amount: number; balance: number; transaction: WalletTransaction }
  | { ok: false; reason: 'not_found' | 'already_redeemed' };

export interface WalletSnapshot {
  wallet: Wallet;
  transactions: WalletTransaction[];
}

export interface TopUpResult {
  wallet: Wallet;
  transaction: WalletTransaction;
}

export interface PaymentsDataService {
  getMethods(userId: string): Observable<PaymentMethod[]>;
  addMethod(userId: string, dto: AddPaymentMethodDto): Observable<AddMethodResult>;
  removeMethod(userId: string, methodId: string): Observable<PaymentMethod[]>;
  setDefaultMethod(userId: string, methodId: string): Observable<PaymentMethod[]>;
  getWalletSnapshot(userId: string): Observable<WalletSnapshot>;
  topUp(userId: string, amount: number, methodId: string): Observable<TopUpResult>;
  getGiftCards(): Observable<GiftCard[]>;
  redeemGiftCode(userId: string, code: string): Observable<RedeemCodeResult>;

  /* --- Finance layer (Phase 1): ledger-backed wallet, intents, tenders --- */
  getFinanceWallet(userId: string): Observable<FinanceWallet>;
  getLedger(userId: string): Observable<LedgerEntry[]>;
  createPaymentIntent(request: CreatePaymentIntentRequest): Observable<PaymentIntent>;
  processPayment(request: ProcessPaymentRequest): Observable<PaymentResult>;
  topUpWallet(request: TopUpWalletRequest): Observable<TopUpWalletResult>;
  getPaymentIntent(intentId: string): Observable<PaymentIntent | null>;
  getFinanceTransactions(userId: string): Observable<FinanceTransaction[]>;
  /** Purchase revert: credits the wallet via a completed refund_credit ledger entry. */
  refundWallet(userId: string, amountMinor: number, reference: string): Observable<FinanceWallet>;
}

export const PAYMENTS_DATA = new InjectionToken<PaymentsDataService>('PAYMENTS_DATA');

/* ==========================================================================
   6b. Finance Layer Contracts (ledger-backed, integer minor units)
   ========================================================================== */

export interface FinanceWallet {
  userId: string;
  /** Derived from completed ledger entries — the ledger is the source of truth. */
  balanceMinor: number;
  currency: Currency;
  status: 'active' | 'locked';
}

export interface CreatePaymentIntentRequest {
  userId: string;
  orderId: string;
  amountMinor: number;
  currency: Currency;
  idempotencyKey?: string;
  /** Defaults to 15 minutes when omitted. */
  ttlMs?: number;
}

export interface ProcessPaymentRequest {
  intentId: string;
  userId: string;
  /** Caller-decided tender amounts in minor units; the service re-validates every rule. */
  tenders: Tender[];
  idempotencyKey: string;
}

export interface TopUpWalletRequest {
  userId: string;
  amountMinor: number;
  methodId: string;
}

export type TopUpWalletResult =
  | { ok: true; wallet: FinanceWallet; entry: LedgerEntry; transaction: FinanceTransaction }
  | { ok: false; reason: 'invalid_amount' | 'method_not_found' };
