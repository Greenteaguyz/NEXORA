import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Game, CreateGameDto, UpdateGameDto } from '../models/game.model';
import { LibraryEntry } from '../models/library-entry.model';
import { Order } from '../models/order.model';
import { User } from '../models/user.model';
import { WishlistEntry } from '../models/wishlist-entry.model';
import { AddPaymentMethodDto, GiftCard, PaymentMethod, Wallet, WalletTransaction } from '../models/payment.model';

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
}

export const PAYMENTS_DATA = new InjectionToken<PaymentsDataService>('PAYMENTS_DATA');
