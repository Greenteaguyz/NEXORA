import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Game, CreateGameDto, UpdateGameDto } from '../models/game.model';
import { LibraryEntry } from '../models/library-entry.model';
import { Order } from '../models/order.model';
import { User } from '../models/user.model';
import { WishlistEntry } from '../models/wishlist-entry.model';

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
  createOrder(userId: string, gameId: string, price: number): Observable<Order>;
  getOrders(userId: string): Observable<Order[]>;
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
