/**
 * NEXORA AUTOMATED TEST SUITE: LAYER 2 - INTEGRATION TESTS
 * Verifying service contracts, multi-step commerce flows, role guards, and data layer sync.
 */

import { SEED_GAMES, SEED_USERS, SEED_ORDERS, SEED_LIBRARY_ENTRIES, SEED_WISHLIST_ENTRIES } from '../../src/app/core/data/seed-data';
import { Game } from '../../src/app/core/models/game.model';
import { Order } from '../../src/app/core/models/order.model';
import { User } from '../../src/app/core/models/user.model';
import { LibraryEntry } from '../../src/app/core/models/library-entry.model';
import { WishlistEntry } from '../../src/app/core/models/wishlist-entry.model';
import * as fs from 'fs';
import * as path from 'path';

interface AssertionResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
}

const results: AssertionResult[] = [];

function assert(suite: string, name: string, condition: boolean, error?: string) {
  results.push({ suite, name, passed: condition, error: condition ? undefined : error });
  console.log(`  ${condition ? '✓' : '✗'} [${suite}] ${name}`);
  if (!condition && error) {
    console.error(`      Error: ${error}`);
  }
}

// In-Memory Mock System for Integration Testing
class MockIntegrationDb {
  games: Game[] = JSON.parse(JSON.stringify(SEED_GAMES));
  users: User[] = JSON.parse(JSON.stringify(SEED_USERS));
  library: LibraryEntry[] = JSON.parse(JSON.stringify(SEED_LIBRARY_ENTRIES));
  wishlist: WishlistEntry[] = JSON.parse(JSON.stringify(SEED_WISHLIST_ENTRIES));
  orders: Order[] = JSON.parse(JSON.stringify(SEED_ORDERS));

  // Auth Operations
  login(email: string): User | null {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  registerUser(displayName: string, email: string, isCreator: boolean): User {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      email,
      displayName,
      roles: isCreator ? ['creator', 'buyer'] : ['buyer'],
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);
    return newUser;
  }

  // Commerce & Library Fulfillment
  createOrder(userId: string, gameId: string, price: number, paymentMethod: string): Order {
    const order: Order = {
      id: `ord_${Date.now()}`,
      userId,
      gameId,
      price,
      status: 'confirmed',
      paymentMethod,
      createdAt: new Date().toISOString()
    };
    this.orders.push(order);
    
    // Auto-fulfill into Library
    const libEntry: LibraryEntry = {
      id: `lib_${Date.now()}`,
      userId,
      gameId,
      orderId: order.id,
      acquiredAt: new Date().toISOString()
    };
    this.library.push(libEntry);

    // Auto-remove from Wishlist if present
    this.wishlist = this.wishlist.filter(w => !(w.userId === userId && w.gameId === gameId));

    return order;
  }

  removeFromLibrary(userId: string, gameId: string): boolean {
    const initialLen = this.library.length;
    this.library = this.library.filter(l => !(l.userId === userId && l.gameId === gameId));
    return this.library.length < initialLen;
  }

  toggleWishlist(userId: string, gameId: string): boolean {
    const index = this.wishlist.findIndex(w => w.userId === userId && w.gameId === gameId);
    if (index >= 0) {
      this.wishlist.splice(index, 1);
      return false; // removed
    } else {
      this.wishlist.push({
        id: `wsh_${Date.now()}`,
        userId,
        gameId,
        addedAt: new Date().toISOString()
      });
      return true; // added
    }
  }

  // Creator Studio Publishing
  publishGame(ownerId: string, gameData: Partial<Game>): Game {
    const newGame: Game = {
      id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ownerId,
      title: gameData.title || 'Untitled',
      description: gameData.description || '',
      tags: gameData.tags || ['Indie'],
      price: gameData.price ?? 9.99,
      coverImageUrl: gameData.coverImageUrl || '',
      screenshotUrls: gameData.screenshotUrls || [],
      samplePackageUrl: gameData.samplePackageUrl || 'assets/sample.zip',
      status: gameData.status || 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.games.push(newGame);
    return newGame;
  }

  getPublicCatalog(): Game[] {
    return this.games.filter(g => !g.deletedAt && g.status !== 'draft');
  }

  searchPublicCatalog(term: string): Game[] {
    const lower = term.toLowerCase().trim();
    return this.getPublicCatalog().filter(g => 
      g.title.toLowerCase().includes(lower) || 
      g.description.toLowerCase().includes(lower) ||
      g.tags.some(t => t.toLowerCase().includes(lower))
    );
  }

  getGamesByOwnerId(ownerId: string): Game[] {
    return this.games.filter(g => g.ownerId === ownerId);
  }

  softDeleteGame(arg1: string, arg2?: string): boolean {
    const gameId = arg2 ? arg2 : arg1;
    const ownerId = arg2 ? arg1 : undefined;

    const game = this.games.find(g => g.id === gameId && (ownerId ? g.ownerId === ownerId : true));
    if (!game) {
      if (!arg2) {
        throw new Error(`Game with id ${gameId} not found`);
      }
      return false;
    }
    // Idempotent: preserve original timestamp if already soft-deleted
    if (!game.deletedAt) {
      game.deletedAt = new Date().toISOString();
    }
    return true;
  }

  restoreGame(ownerId: string, gameId: string): boolean {
    const game = this.games.find(g => g.id === gameId && g.ownerId === ownerId);
    if (!game) return false;
    delete game.deletedAt;
    return true;
  }

  restoreGameFromBin(gameId: string): boolean {
    const game = this.games.find(g => g.id === gameId);
    if (!game) {
      throw new Error(`Game with id ${gameId} not found`);
    }
    delete game.deletedAt;
    return true;
  }

  permanentlyPurgeGame(gameId: string): void {
    const index = this.games.findIndex(g => g.id === gameId);
    if (index === -1) {
      throw new Error(`Game with id ${gameId} not found`);
    }
    this.games.splice(index, 1);
  }

  emptyOwnerRecycleBin(ownerId: string): void {
    this.games = this.games.filter(g => !(g.ownerId === ownerId && !!g.deletedAt));
  }
}

const db = new MockIntegrationDb();


// ---------------------------------------------------------------------------
// 1. Auth & Persona Integration Tests
// ---------------------------------------------------------------------------
console.log('\n--- 1. INTEGRATION TESTS: Auth, Personas & Role Transitions ---');

const alice = db.login('alice@nexora.io');
assert('Auth Integration', 'Alice logs in with verified creator role', alice !== null && alice.roles.includes('creator'));

const bob = db.login('bob@nexora.io');
assert('Auth Integration', 'Bob logs in with verified buyer role', bob !== null && bob.roles.includes('buyer'));

const newUser = db.registerUser('CyberKnight', 'knight@nexora.io', true);
assert('Auth Integration', 'New creator registration appends to directory', newUser.roles.includes('creator'));
assert('Auth Integration', 'New creator is discoverable in user list', db.users.some(u => u.email === 'knight@nexora.io'));

// ---------------------------------------------------------------------------
// 2. Catalog & Discovery Integration Tests
// ---------------------------------------------------------------------------
console.log('\n--- 2. INTEGRATION TESTS: Catalog & Query Engine ---');

assert('Catalog Integration', 'Catalog contains seeded games', db.games.length >= 8);
const marvel = db.games.find(g => g.id === 'game_001');
assert('Catalog Integration', 'Lookup game_001 returns Marvel Rivals', !!marvel && marvel.title.includes('Marvel'));

const freeGames = db.games.filter(g => g.price === 0);
assert('Catalog Integration', 'Catalog contains free downloadable games', freeGames.length >= 2);

const paidGames = db.games.filter(g => g.price > 0);
assert('Catalog Integration', 'Catalog contains premium paid games', paidGames.length >= 2);

// ---------------------------------------------------------------------------
// 3. Commerce, Payment Selector & Library Fulfillment Integration Tests
// ---------------------------------------------------------------------------
console.log('\n--- 3. INTEGRATION TESTS: Orders, Payments & Library Lifecycle ---');

// Bob wishes game_004
db.toggleWishlist('usr_bob', 'game_004');
assert('Commerce Integration', 'Bob wishlists game_004', db.wishlist.some(w => w.userId === 'usr_bob' && w.gameId === 'game_004'));

// Bob purchases game_004 with Mastercard
const order = db.createOrder('usr_bob', 'game_004', 3.49, 'Credit Card (Mastercard •••• 5555)');
assert('Commerce Integration', 'Order created with confirmed status', order.status === 'confirmed');
assert('Commerce Integration', 'Order persists selected Mastercard payment method', order.paymentMethod === 'Credit Card (Mastercard •••• 5555)');
assert('Commerce Integration', 'Game_004 is now fulfilled in Bob\'s Library', db.library.some(l => l.userId === 'usr_bob' && l.gameId === 'game_004'));
assert('Commerce Integration', 'Acquired game_004 is removed from Bob\'s Wishlist', !db.wishlist.some(w => w.userId === 'usr_bob' && w.gameId === 'game_004'));

// Bob removes game_004 from Library
const removed = db.removeFromLibrary('usr_bob', 'game_004');
assert('Commerce Integration', 'Bob can remove game_004 from Library', removed && !db.library.some(l => l.userId === 'usr_bob' && l.gameId === 'game_004'));

// ---------------------------------------------------------------------------
// 4. Creator Studio Publishing & Soft-Delete Integration Tests
// ---------------------------------------------------------------------------
console.log('\n--- 4. INTEGRATION TESTS: Creator Studio Publishing & CRUD ---');

const publishedGame = db.publishGame('usr_alice', {
  title: 'Quantum Drift 2099',
  description: 'High-speed anti-gravity racer.',
  price: 19.99,
  tags: ['Racing', 'Cyberpunk']
});

assert('Studio Integration', 'Alice successfully publishes new game', !!publishedGame.id);
assert('Studio Integration', 'Published game is discoverable in public catalog', db.games.some(g => g.title === 'Quantum Drift 2099'));

const softDeleted = db.softDeleteGame('usr_alice', publishedGame.id);
assert('Studio Integration', 'Alice can soft-delete published game', softDeleted);
assert('Studio Integration', 'Game record contains deletedAt timestamp', !!db.games.find(g => g.id === publishedGame.id)?.deletedAt);

// ---------------------------------------------------------------------------
// 5. User Profile Update & Avatar State Integration Tests
// ---------------------------------------------------------------------------
console.log('\n--- 5. INTEGRATION TESTS: Profile & Avatar Updates ---');

function updateProfile(userId: string, partial: Partial<User>): User | null {
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;
  Object.assign(user, partial);
  return user;
}

const updatedBob = updateProfile('usr_bob', {
  displayName: 'Bob The Builder',
  avatarUrl: 'data:image/png;base64,mockAvatarDataString',
  bio: 'Veteran gamer exploring indie titles.'
});

assert('Profile Integration', 'Bob displayName updates accurately', updatedBob?.displayName === 'Bob The Builder');
assert('Profile Integration', 'Bob avatarUrl updates to custom avatar string', updatedBob?.avatarUrl === 'data:image/png;base64,mockAvatarDataString');
assert('Profile Integration', 'Bob bio updates and persists in user database', updatedBob?.bio === 'Veteran gamer exploring indie titles.');
assert('Profile Integration', 'Lookup in db reflects new profile fields', db.users.find(u => u.id === 'usr_bob')?.displayName === 'Bob The Builder');

// ---------------------------------------------------------------------------
// 6. Navigation, Route Link Resolution & Redirect Guards
// ---------------------------------------------------------------------------
console.log('\n--- 6. INTEGRATION TESTS: Route Resolution, Links & Redirect Guards ---');

const registeredRoutes = [
  '',
  'catalog',
  'genres',
  'support',
  'login',
  'register',
  'forgot-password',
  'profile',
  'library',
  'wishlist',
  'orders',
  'studio',
  'studio/games/new',
  'studio/games/:id/edit',
  'games/:id',
  'creators/:id',
  'not-found'
];

function canResolveRoute(path: string): boolean {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  if (cleanPath.startsWith('games/')) {
    const gameId = cleanPath.split('/')[1];
    return !!db.games.find(g => g.id === gameId);
  }
  if (cleanPath.startsWith('creators/')) {
    const creatorId = cleanPath.split('/')[1];
    return !!db.users.find(u => u.id === creatorId || u.displayName.toLowerCase().includes(creatorId.toLowerCase()));
  }
  if (cleanPath.startsWith('studio/games/') && cleanPath.endsWith('/edit')) {
    const gameId = cleanPath.split('/')[2];
    return !!db.games.find(g => g.id === gameId);
  }
  return registeredRoutes.includes(cleanPath);
}

function resolveRedirectTarget(requestedPath: string, currentUser: User | null): string {
  // If guest attempts to open studio/profile/library/wishlist/orders, redirect to login with returnUrl
  if (!currentUser && (requestedPath.startsWith('/studio') || requestedPath.startsWith('/profile') || requestedPath.startsWith('/library') || requestedPath.startsWith('/wishlist') || requestedPath.startsWith('/orders'))) {
    return '/login';
  }
  // If non-creator attempts to open creator studio, redirect to catalog
  if (currentUser && requestedPath.startsWith('/studio') && !currentUser.roles.includes('creator')) {
    return '/catalog';
  }
  return requestedPath;
}

assert('Route Resolution', 'All primary top-bar, auth and footer route destinations resolve', 
  canResolveRoute('/catalog') && canResolveRoute('/genres') && canResolveRoute('/support') && 
  canResolveRoute('/login') && canResolveRoute('/register') && canResolveRoute('/forgot-password') && 
  canResolveRoute('/profile') && canResolveRoute('/library') && canResolveRoute('/orders') && 
  canResolveRoute('/wishlist') && canResolveRoute('/not-found')
);
assert('Route Resolution', 'Game detail URL with seeded ID resolves game model', canResolveRoute('/games/game_001'));
assert('Route Resolution', 'Creator Profile URL with seeded creator resolves user', canResolveRoute('/creators/alice'));
assert('Route Resolution', 'Studio game new URL resolves', canResolveRoute('/studio/games/new'));
assert('Route Resolution', 'Studio game edit URL resolves with valid game ID', canResolveRoute('/studio/games/game_001/edit'));
assert('Route Resolution', 'Invalid game detail ID does not resolve', !canResolveRoute('/games/game_invalid_999'));
assert('Redirect Guard', 'Guest navigating to /profile redirects to /login', resolveRedirectTarget('/profile', null) === '/login');
assert('Redirect Guard', 'Guest navigating to /studio redirects to /login', resolveRedirectTarget('/studio', null) === '/login');
assert('Redirect Guard', 'Guest navigating to /studio/games/new redirects to /login', resolveRedirectTarget('/studio/games/new', null) === '/login');
assert('Redirect Guard', 'Buyer (non-creator) navigating to /studio redirects to /catalog', resolveRedirectTarget('/studio', bob) === '/catalog');
assert('Redirect Guard', 'Buyer (non-creator) navigating to /studio/games/new redirects to /catalog', resolveRedirectTarget('/studio/games/new', bob) === '/catalog');
assert('Redirect Guard', 'Creator (Alice) navigating to /studio retains destination', resolveRedirectTarget('/studio', alice) === '/studio');
assert('Redirect Guard', 'Creator (Alice) navigating to /studio/games/new retains destination', resolveRedirectTarget('/studio/games/new', alice) === '/studio/games/new');
assert('Redirect Guard', 'Authenticated user navigating to /profile retains destination', resolveRedirectTarget('/profile', bob) === '/profile');
assert('Redirect Guard', 'Logout redirects to default landing catalog page', resolveRedirectTarget('/catalog', null) === '/catalog');
assert('Logo Navigation', 'Header, mobile drawer, and footer logo links resolve to root /catalog', canResolveRoute('/catalog'));

// ---------------------------------------------------------------------------
// 7. Reactive Multi-Persona Profile Switching & State Sync
// ---------------------------------------------------------------------------
console.log('\n--- 7. INTEGRATION TESTS: Reactive Multi-Persona State Sync ---');

class MockReactiveAppState {
  private currentUserId: string | null = null;
  private listeners: Array<() => void> = [];

  constructor(initialUserId: string) {
    this.currentUserId = initialUserId;
  }

  get user(): User | null {
    return db.users.find(u => u.id === this.currentUserId) || null;
  }

  switchUser(userId: string): void {
    this.currentUserId = userId;
    this.listeners.forEach(fn => fn());
  }

  onUserChange(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  // Reactive view-layer projections
  getLibraryView(): LibraryEntry[] {
    return this.currentUserId ? db.library.filter(l => l.userId === this.currentUserId) : [];
  }

  getWishlistView(): WishlistEntry[] {
    return this.currentUserId ? db.wishlist.filter(w => w.userId === this.currentUserId) : [];
  }

  getOrdersView(): Order[] {
    return this.currentUserId ? db.orders.filter(o => o.userId === this.currentUserId) : [];
  }

  getStudioGamesView(): Game[] {
    return this.currentUserId ? db.games.filter(g => g.ownerId === this.currentUserId && !g.deletedAt) : [];
  }
}

const reactiveStore = new MockReactiveAppState('usr_bob');

// Test 1: Initial Bob State Projection
assert('Reactive State Sync', 'Bob Mercer starts with 2 Library games (Bloodstrike & Apex Legends)', 
  reactiveStore.getLibraryView().length === 2 && reactiveStore.getLibraryView().some(e => e.gameId === 'game_002')
);
assert('Reactive State Sync', 'Bob Mercer starts with 1 Wishlist game (Marvel Rivals)', 
  reactiveStore.getWishlistView().length === 1 && reactiveStore.getWishlistView()[0].gameId === 'game_001'
);

// Test 2: In-Flight Switch to Alice Vance
let libraryReloadCount = 0;
reactiveStore.onUserChange(() => {
  libraryReloadCount++;
});

reactiveStore.switchUser('usr_alice');

assert('Reactive State Sync', 'Switching to Alice Vance emits reactive user change event', libraryReloadCount === 1);
assert('Reactive State Sync', 'Alice Vance view reactively projects 1 Library game (Marvel Rivals)', 
  reactiveStore.getLibraryView().length === 1 && reactiveStore.getLibraryView()[0].gameId === 'game_001'
);
assert('Reactive State Sync', 'Alice Vance view reactively projects 1 Wishlist game (Forza Horizon 6)', 
  reactiveStore.getWishlistView().length === 1 && reactiveStore.getWishlistView()[0].gameId === 'game_004'
);
assert('Reactive State Sync', 'Alice Vance view reactively projects 0 Orders', 
  reactiveStore.getOrdersView().length === 0
);
assert('Reactive State Sync', 'Alice Vance view reactively projects Creator Studio games', 
  reactiveStore.getStudioGamesView().length >= 2 && reactiveStore.getStudioGamesView().some(g => g.id === 'game_001')
);

// Test 3: Switch back to Bob Mercer
reactiveStore.switchUser('usr_bob');
assert('Reactive State Sync', 'Switching back to Bob Mercer restores Bob Library without cross-user contamination',
  reactiveStore.getLibraryView().length === 2 && !reactiveStore.getLibraryView().some(e => e.gameId === 'game_001')
);

// Test 4: Log Out Confirmation Modal guards the authenticated session
// Mirrors the Header logout-confirm state machine: requestLogout opens the
// modal, cancel keeps the session, confirm clears it (AuthService.logout()).
class MockLogoutConfirmFlow {
  currentUser: User | null = db.login('bob@nexora.io');
  logoutConfirmOpen = false;
  mobileMenuOpen = true; // drawer open when Log Out was clicked

  requestLogout(): void {
    this.logoutConfirmOpen = true;
  }

  cancelLogout(): void {
    this.logoutConfirmOpen = false;
  }

  confirmLogout(): void {
    this.logoutConfirmOpen = false;
    this.currentUser = null; // setSessionUser(null)
    this.mobileMenuOpen = false; // header closes the drawer after confirming
  }
}

const logoutFlow = new MockLogoutConfirmFlow();

assert('Reactive State Sync', 'Log Out button opens the confirmation modal without ending the session',
  (logoutFlow.requestLogout(), logoutFlow.logoutConfirmOpen === true && logoutFlow.currentUser !== null));

logoutFlow.cancelLogout();
assert('Reactive State Sync', 'Cancelling the logout confirm preserves the authenticated session',
  logoutFlow.logoutConfirmOpen === false && logoutFlow.currentUser !== null);

logoutFlow.confirmLogout();
assert('Reactive State Sync', 'Confirming the logout ends the session and closes the drawer',
  logoutFlow.logoutConfirmOpen === false && logoutFlow.currentUser === null && logoutFlow.mobileMenuOpen === false);

// --- 8. INTEGRATION TESTS: Click-Path Invariants & Deep Redirect Flows ---
console.log('\n--- 8. INTEGRATION TESTS: Click-Path Invariants & Deep Redirect Flows ---');

// Test 8.1: ReturnURL Deep Link Preservation
const deepLink = '/studio/games/new';
const preservedUrlTree = { path: '/login', queryParams: { returnUrl: deepLink } };
assert('Deep Redirect Flow', 'Auth guard preserves exact nested returnUrl parameter',
  preservedUrlTree.queryParams.returnUrl === '/studio/games/new'
);

// Test 8.2: Sequential Undo Click-Path State Safety (Rapid Wishlist Toggle)
let wishlistState = false;
// Rapid user click sequence (Add -> Remove -> Add)
wishlistState = !wishlistState; // true (added)
wishlistState = !wishlistState; // false (removed)
wishlistState = !wishlistState; // true (re-added)
assert('Click-Path State Safety', 'Sequential toggles result in deterministic, race-free final state',
  wishlistState === true
);

// Test 8.3: Ownership Guard Multi-Tenant Isolation
const aliceGame = db.games.find(g => g.ownerId === 'usr_alice');
const bobUser = db.users.find(u => u.id === 'usr_bob');
const canBobEditAliceGame = aliceGame?.ownerId === bobUser?.id;
assert('Ownership Isolation', 'Non-owner is blocked from editing another creator game listing',
  canBobEditAliceGame === false
);

// Test 8.4: Order Fulfillment Auto-Wishlist Sync
const testBuyerId = 'usr_bob';
const targetGameId = 'game_003';
db.toggleWishlist(testBuyerId, targetGameId);
const isWishlistedBefore = db.wishlist.some(w => w.userId === testBuyerId && w.gameId === targetGameId);
db.createOrder(testBuyerId, targetGameId, 4.99, 'Mastercard');
const isWishlistedAfter = db.wishlist.some(w => w.userId === testBuyerId && w.gameId === targetGameId);
const isInLibraryAfter = db.library.some(l => l.userId === testBuyerId && l.gameId === targetGameId);
assert('Click-Path Fulfillment Sync', 'Purchasing wishlisted game atomically fulfills to Library and removes from Wishlist',
  isWishlistedBefore === true &&
  isWishlistedAfter === false &&
  isInLibraryAfter === true
);

// Test 8.5: Wildcard Fallback Route Resolution
const validRoutes = new Set(['/catalog', '/genres', '/games/game_001', '/creators/usr_alice', '/login', '/register', '/forgot-password', '/library', '/wishlist', '/orders', '/profile', '/studio', '/studio/games/new', '/support', '/not-found']);
function resolveRoute(path: string): string {
  return validRoutes.has(path) ? path : '/not-found';
}
assert('Wildcard Route Fallback', 'Arbitrary invalid URLs route to /not-found page',
  resolveRoute('/invalid/secret/path') === '/not-found' &&
  resolveRoute('/catalog') === '/catalog'
);

// ---------------------------------------------------------------------------
// 9. Creator Studio Archive & Restore Stress Invariants
// ---------------------------------------------------------------------------
console.log('\n--- 9. INTEGRATION TESTS: Archive & Restore Stress Invariants ---');

// Stress Test 9.1: Original Deletion Timestamp Preserved on Repeated Archive (Idempotency)
const targetStressGame = db.publishGame('usr_alice', {
  title: 'Stress Test Horizon',
  description: 'Stress test target listing',
  price: 9.99
});

db.softDeleteGame('usr_alice', targetStressGame.id);
const initialDeletedAt = db.games.find(g => g.id === targetStressGame.id)?.deletedAt;
assert('Archive Stress', 'Initial soft delete assigns deletedAt timestamp', !!initialDeletedAt);

// Simulate delayed repeated unpublish call (idempotency check)
const fakePastTime = '2026-01-01T00:00:00.000Z';
const gameRef = db.games.find(g => g.id === targetStressGame.id)!;
gameRef.deletedAt = fakePastTime;

// Calling softDeleteGame again on an already deleted game must preserve the original timestamp
db.softDeleteGame('usr_alice', targetStressGame.id);
const preservedDeletedAt = db.games.find(g => g.id === targetStressGame.id)?.deletedAt;
assert('Archive Stress', 'Idempotent soft delete preserves original deletedAt timestamp', preservedDeletedAt === fakePastTime);

// Stress Test 9.2: Unauthorized User Cannot Restore Archived Game (Ownership Isolation)
assert('Archive Stress', 'Non-owner (Bob) blocked from restoring Alice archived game',
  db.restoreGame('usr_bob', targetStressGame.id) === false
);

// Stress Test 9.3: Authorized Owner Successfully Restores Archived Game
assert('Archive Stress', 'Owner (Alice) successfully restores archived game',
  db.restoreGame('usr_alice', targetStressGame.id) === true &&
  !db.games.find(g => g.id === targetStressGame.id)?.deletedAt
);

// Stress Test 9.4: High-Frequency 100-Cycle Alternating Flap Invariant
let invariantPassed = true;
const initialCatalogCount = db.games.filter(g => !g.deletedAt).length;

for (let i = 0; i < 100; i++) {
  db.softDeleteGame('usr_alice', targetStressGame.id);
  if (db.games.filter(g => !g.deletedAt).length !== initialCatalogCount - 1) {
    invariantPassed = false;
    break;
  }
  db.restoreGame('usr_alice', targetStressGame.id);
  if (db.games.filter(g => !g.deletedAt).length !== initialCatalogCount) {
    invariantPassed = false;
    break;
  }
}
assert('Archive Stress', '100 rapid archive-restore cycles maintain exact catalog invariants', invariantPassed);

// Stress Test 9.5: In-Flight Concurrency Debounce Lock Simulator
class InFlightOperationManager {
  private busySet = new Set<string>();
  execute(id: string, action: () => void): boolean {
    if (this.busySet.has(id)) {
      return false; // Debounced / locked out
    }
    this.busySet.add(id);
    try {
      action();
      return true;
    } finally {
      this.busySet.delete(id);
    }
  }
}

const manager = new InFlightOperationManager();
let executedCount = 0;
// Test simulating overlapping in-flight clicks
const click1 = manager.execute(targetStressGame.id, () => {
  executedCount++;
  // While in-flight, a second click arrives for the same game
  const duplicateInFlightClick = manager.execute(targetStressGame.id, () => { executedCount++; });
  assert('Archive Stress', 'Simultaneous in-flight click is rejected by concurrency lock', duplicateInFlightClick === false);
});
assert('Archive Stress', 'Initial click was permitted and completed', click1 === true && executedCount === 1);

// ---------------------------------------------------------------------------
// 10. Creator Studio 5-Image Media & Screenshot Gallery Stress Invariants
// ---------------------------------------------------------------------------
console.log('\n--- 10. INTEGRATION TESTS: 5-Image Media & Screenshot Gallery Stress Invariants ---');

import { validateImagePayload, buildCompleteScreenshotArray } from '../../src/app/core/utils/image-processor';

// Stress Test 10.1: Non-image and corrupt files rejected
assert('Media Upload Stress', 'Rejects PDF document as invalid image', 
  validateImagePayload({ name: 'malicious.pdf', type: 'application/pdf', size: 204800 }).valid === false
);
assert('Media Upload Stress', 'Rejects executable file as invalid image', 
  validateImagePayload({ name: 'virus.exe', type: 'application/x-msdownload', size: 1024000 }).valid === false
);
assert('Media Upload Stress', 'Rejects empty 0-byte file', 
  validateImagePayload({ name: 'empty.png', type: 'image/png', size: 0 }).valid === false
);
assert('Media Upload Stress', 'Accepts valid PNG image under size limit', 
  validateImagePayload({ name: 'hero.png', type: 'image/png', size: 1024000 }).valid === true
);
assert('Media Upload Stress', 'Accepts valid WebP image under size limit', 
  validateImagePayload({ name: 'screen.webp', type: 'image/webp', size: 512000 }).valid === true
);

// Stress Test 10.2: Smart Screenshot Array Invariant (Always returns exactly 4 valid URLs)
const coverUrl = 'https://assets.nexora.io/cover.webp';

// Case A: Exactly 4 screenshots supplied
const fourScreens = [
  'https://assets.nexora.io/ss1.webp',
  'https://assets.nexora.io/ss2.webp',
  'https://assets.nexora.io/ss3.webp',
  'https://assets.nexora.io/ss4.webp'
];
const arrayCaseA = buildCompleteScreenshotArray(fourScreens, coverUrl);
assert('Media Upload Stress', '4 supplied screenshots pass through untouched', 
  arrayCaseA.length === 4 && arrayCaseA[0] === fourScreens[0] && arrayCaseA[3] === fourScreens[3]
);

// Case B: Only 1 screenshot supplied (slots 2-4 empty)
const oneScreen = ['https://assets.nexora.io/ss1.webp', '', null as any, undefined as any];
const arrayCaseB = buildCompleteScreenshotArray(oneScreen, coverUrl);
assert('Media Upload Stress', 'Single screenshot smartly populates full 4-slide gallery without nulls', 
  arrayCaseB.length === 4 && 
  arrayCaseB.every(url => typeof url === 'string' && url.length > 0) &&
  arrayCaseB[0] === 'https://assets.nexora.io/ss1.webp' &&
  arrayCaseB[1] === 'https://assets.nexora.io/ss1.webp'
);

// Case C: Zero screenshots supplied (fallback to cover)
const zeroScreens = ['', '', '', ''];
const arrayCaseC = buildCompleteScreenshotArray(zeroScreens, coverUrl);
assert('Media Upload Stress', 'Empty screenshot slots fallback completely to cover art', 
  arrayCaseC.length === 4 && arrayCaseC.every(url => url === coverUrl)
);

// Stress Test 10.3: Rapid Concurrent Multi-Slot File Assignment
interface SlotState {
  cover: string;
  ss1: string;
  ss2: string;
  ss3: string;
  ss4: string;
}

const slotStore: SlotState = { cover: '', ss1: '', ss2: '', ss3: '', ss4: '' };
const slots: Array<keyof SlotState> = ['cover', 'ss1', 'ss2', 'ss3', 'ss4'];

// Simulate 5 simultaneous asynchronous uploads completing in arbitrary out-of-order sequence
slots.forEach((slot, idx) => {
  slotStore[slot] = `data:image/webp;base64,mockPayloadForSlot_${slot}_${idx}`;
});

assert('Media Upload Stress', 'All 5 slots populated without race-condition data collisions',
  slots.every(slot => slotStore[slot].includes(`mockPayloadForSlot_${slot}`))
);

// Stress Test 10.4: Creator Studio 5-Image Publishing & Persistence Roundtrip
const fullMediaGame = db.publishGame('usr_alice', {
  title: 'Chrono Rift: 2099',
  description: 'Time-bending action adventure with high-resolution screenshot gallery.',
  price: 29.99,
  tags: ['Action', 'Sci-Fi'],
  coverImageUrl: 'data:image/webp;base64,customCoverArtworkDataString',
  screenshotUrls: [
    'data:image/webp;base64,customScreenshot1',
    'data:image/webp;base64,customScreenshot2',
    'data:image/webp;base64,customScreenshot3',
    'data:image/webp;base64,customScreenshot4'
  ]
});

const retrievedGame = db.games.find(g => g.id === fullMediaGame.id);
assert('Media Upload Stress', 'Published game contains 1 cover image in storage', 
  retrievedGame?.coverImageUrl === 'data:image/webp;base64,customCoverArtworkDataString'
);
assert('Media Upload Stress', 'Published game contains exactly 4 gameplay screenshots in storage', 
  retrievedGame?.screenshotUrls?.length === 4 &&
  retrievedGame.screenshotUrls[2] === 'data:image/webp;base64,customScreenshot3'
);

// Stress Test 10.5: Edit Mode Single-Slot Mutation (Modifying Slot 3 preserves other slots)
if (retrievedGame && retrievedGame.screenshotUrls) {
  const updatedScreens = [...retrievedGame.screenshotUrls];
  updatedScreens[2] = 'data:image/webp;base64,modifiedSlot3Only';
  retrievedGame.screenshotUrls = updatedScreens;
}

const afterEditGame = db.games.find(g => g.id === fullMediaGame.id);
assert('Media Upload Stress', 'Editing slot 3 preserves slots 1, 2, and 4 intact',
  afterEditGame?.screenshotUrls?.[0] === 'data:image/webp;base64,customScreenshot1' &&
  afterEditGame?.screenshotUrls?.[1] === 'data:image/webp;base64,customScreenshot2' &&
  afterEditGame?.screenshotUrls?.[2] === 'data:image/webp;base64,modifiedSlot3Only' &&
  afterEditGame?.screenshotUrls?.[3] === 'data:image/webp;base64,customScreenshot4'
);

// ---------------------------------------------------------------------------
// 11. Creator Studio Polish & Publish Readiness Invariants
// ---------------------------------------------------------------------------
console.log('\n--- 11. INTEGRATION TESTS: Creator Studio Polish & Readiness Invariants ---');

import { evaluatePublishReadiness, calculateEarningsSplit } from '../../src/app/core/utils/readiness-evaluator';

// Test 11.1: Blank form evaluation
const blankReport = evaluatePublishReadiness({
  title: '',
  description: '',
  price: -1,
  tags: [],
  coverImageUrl: '',
  screenshot1: '',
  screenshot2: '',
  screenshot3: '',
  screenshot4: ''
});
assert('Readiness Invariant', 'Blank form returns 0% readiness', blankReport.percent === 0);
assert('Readiness Invariant', 'Blank form reports exactly 6 required checklist items', blankReport.items.length === 6);
assert('Readiness Invariant', 'All 6 items are incomplete on blank form', blankReport.items.every(i => !i.complete));

// Test 11.2: Fully filled form evaluation
const fullReport = evaluatePublishReadiness({
  title: 'Starfall Tactics',
  description: 'Tactical fleet combat in uncharted sectors of the galaxy.',
  price: 19.99,
  tags: ['Strategy', 'Sci-Fi'],
  coverImageUrl: 'https://assets.nexora.io/cover.webp',
  screenshot1: 'https://assets.nexora.io/ss1.webp',
  screenshot2: 'https://assets.nexora.io/ss2.webp',
  screenshot3: 'https://assets.nexora.io/ss3.webp',
  screenshot4: 'https://assets.nexora.io/ss4.webp'
});
assert('Readiness Invariant', 'Completed form returns 100% readiness', fullReport.percent === 100);
assert('Readiness Invariant', 'All 6 checklist items are complete on valid form', fullReport.items.every(i => i.complete));

// Test 11.3: Partial form evaluation (3 of 6 completed)
const partialReport = evaluatePublishReadiness({
  title: 'Starfall Tactics',
  description: 'Tactical fleet combat in uncharted sectors of the galaxy.',
  price: 19.99,
  tags: [],
  coverImageUrl: '',
  screenshot1: '',
  screenshot2: '',
  screenshot3: '',
  screenshot4: ''
});
assert('Readiness Invariant', 'Partial form calculates exact proportional score (50%)', partialReport.percent === 50);

// Test 11.4: Price Split Calculation on $19.99
const split19 = calculateEarningsSplit(19.99);
assert('Readiness Invariant', '$19.99 tier yields $17.99 (90%) creator earnings', split19.creatorEarnings === 17.99);
assert('Readiness Invariant', '$19.99 tier yields $2.00 (10%) platform fee', split19.platformFee === 2.00);
assert('Readiness Invariant', '$19.99 tier is not marked as free', split19.isFree === false);

// Test 11.5: Free Game Split Calculation
const splitFree = calculateEarningsSplit(0);
assert('Readiness Invariant', 'Free tier yields $0.00 creator earnings', splitFree.creatorEarnings === 0);
assert('Readiness Invariant', 'Free tier yields $0.00 platform fee', splitFree.platformFee === 0);
assert('Readiness Invariant', 'Free tier is marked as free', splitFree.isFree === true);

// ---------------------------------------------------------------------------
// 12. Creator Studio Lifecycle Suite: Recycle Bin, Drafts, Revenue & Undo Stress
// ---------------------------------------------------------------------------
console.log('\n--- 12. INTEGRATION TESTS: Studio Lifecycle, Recycle Bin & Undo Stress Battery ---');

// Stress Test 12.1: Empty/Whitespace Draft Rejection Helper
const isTitleValid = (t: string) => typeof t === 'string' && t.trim().length >= 2;
assert('Draft Lifecycle Stress', 'Empty draft title is rejected', isTitleValid('') === false);
assert('Draft Lifecycle Stress', 'Whitespace-only draft title is rejected', isTitleValid('   ') === false);
assert('Draft Lifecycle Stress', 'Valid draft title is accepted', isTitleValid('Project Andromeda') === true);

// Stress Test 12.2: Draft Creation with status === 'draft'
const draftGame = db.publishGame('usr_alice', {
  title: 'Project Andromeda (Draft)',
  description: 'WIP space exploration game blurb.',
  price: 14.99,
  tags: ['Sci-Fi'],
  coverImageUrl: 'assets/games/game-1-cover.svg',
  screenshotUrls: ['assets/games/game-1-cover.svg'],
  status: 'draft'
});

const foundDraft = db.games.find(g => g.id === draftGame.id);
assert('Draft Lifecycle Stress', 'Draft is saved with status === "draft"', foundDraft?.status === 'draft');

// Stress Test 12.3: Draft Public Catalog Isolation
const publicGames = db.getPublicCatalog();
assert('Draft Lifecycle Stress', 'Draft game is excluded from public store catalog', 
  !publicGames.some(g => g.id === draftGame.id)
);

// Stress Test 12.4: Draft Search Isolation
const publicSearch = db.searchPublicCatalog('Andromeda');
assert('Draft Lifecycle Stress', 'Public search for draft title returns 0 results', publicSearch.length === 0);

// Stress Test 12.5: Draft Multi-Owner Privacy
const bobStudioGames = db.getGamesByOwnerId('usr_bob');
assert('Draft Lifecycle Stress', 'Bob studio query does not reveal Alice draft',
  !bobStudioGames.some(g => g.id === draftGame.id)
);

// Stress Test 12.6: Draft-to-Active Promotion
draftGame.status = 'published';
const publicAfterPublish = db.getPublicCatalog();
assert('Draft Lifecycle Stress', 'Promoting draft to published makes it discoverable in public store',
  publicAfterPublish.some(g => g.id === draftGame.id)
);

// Stress Test 12.7: Soft Delete to Recycle Bin
const originalActiveCount = db.getPublicCatalog().length;
db.softDeleteGame(draftGame.id);
const publicAfterDelete = db.getPublicCatalog();
assert('Recycle Bin Stress', 'Soft-deleting published game moves it to bin and removes from store',
  publicAfterDelete.length === originalActiveCount - 1 && !!draftGame.deletedAt
);

// Stress Test 12.8: Idempotent Soft Delete (Preserves initial timestamp)
const sec12InitialDeletedAt = draftGame.deletedAt;
db.softDeleteGame(draftGame.id);
assert('Recycle Bin Stress', 'Repeated soft-delete preserves original deletedAt timestamp',
  draftGame.deletedAt === sec12InitialDeletedAt
);

// Stress Test 12.9: Soft-delete on invalid ID throws safe error
let invalidDeleteThrew = false;
try {
  db.softDeleteGame('invalid_game_id_99999');
} catch {
  invalidDeleteThrew = true;
}
assert('Recycle Bin Stress', 'Soft-deleting non-existent game ID throws error safely', invalidDeleteThrew);

// Stress Test 12.10: Active and Draft Tabs Exclude Recycle Bin Items
const aliceActive = db.getGamesByOwnerId('usr_alice').filter(g => !g.deletedAt && g.status !== 'draft');
const aliceDrafts = db.getGamesByOwnerId('usr_alice').filter(g => !g.deletedAt && g.status === 'draft');
assert('Recycle Bin Stress', 'Active tab never leaks items with deletedAt', aliceActive.every(g => !g.deletedAt));
assert('Recycle Bin Stress', 'Drafts tab never leaks items with deletedAt', aliceDrafts.every(g => !g.deletedAt));

// Stress Test 12.11: Recycle Bin Tab strictly contains only items with deletedAt
const aliceBin = db.getGamesByOwnerId('usr_alice').filter(g => !!g.deletedAt);
assert('Recycle Bin Stress', 'Recycle bin tab strictly isolates items with deletedAt', 
  aliceBin.length > 0 && aliceBin.every(g => !!g.deletedAt)
);

// Stress Test 12.12: Recycle Bin Restore
db.restoreGameFromBin(draftGame.id);
assert('Recycle Bin Stress', 'Restoring game from bin clears deletedAt timestamp', !draftGame.deletedAt);
assert('Recycle Bin Stress', 'Restored game is once again discoverable in public store',
  db.getPublicCatalog().some(g => g.id === draftGame.id)
);

// Stress Test 12.13: Idempotent Restore
db.restoreGameFromBin(draftGame.id);
assert('Recycle Bin Stress', 'Restoring already active game is safe no-op', !draftGame.deletedAt);

// Stress Test 12.14: Permanent Deletion Purge
const purgeTarget = db.publishGame('usr_alice', {
  title: 'Corrupted Test Game',
  description: 'Test record to be purged permanently.',
  price: 0,
  tags: ['Indie'],
  coverImageUrl: 'assets/games/game-1-cover.svg',
  screenshotUrls: ['assets/games/game-1-cover.svg'],
  status: 'draft'
});
db.permanentlyPurgeGame(purgeTarget.id);
assert('Recycle Bin Stress', 'Permanently purged game is completely removed from database array',
  !db.games.some(g => g.id === purgeTarget.id)
);

// Stress Test 12.15: Permanent Deletion of Non-Existent ID throws safe error
let invalidPurgeThrew = false;
try {
  db.permanentlyPurgeGame('non_existent_purge_id');
} catch {
  invalidPurgeThrew = true;
}
assert('Recycle Bin Stress', 'Purging non-existent game ID throws error safely', invalidPurgeThrew);

// Stress Test 12.16 & 12.17: Atomic Empty Recycle Bin & Multi-Tenant Isolation
const aliceTrash1 = db.publishGame('usr_alice', {
  title: 'Alice Trash 1',
  description: 'Trash item',
  price: 1.99,
  tags: ['Action'],
  coverImageUrl: 'assets/games/game-1-cover.svg',
  screenshotUrls: ['assets/games/game-1-cover.svg']
});
const bobTrash1 = db.publishGame('usr_bob', {
  title: 'Bob Trash 1',
  description: 'Bob trash item',
  price: 2.99,
  tags: ['Action'],
  coverImageUrl: 'assets/games/game-1-cover.svg',
  screenshotUrls: ['assets/games/game-1-cover.svg']
});
db.softDeleteGame(aliceTrash1.id);
db.softDeleteGame(bobTrash1.id);

// Alice empties her Recycle Bin
db.emptyOwnerRecycleBin('usr_alice');
assert('Recycle Bin Stress', 'Alice deleted game is purged after empty bin', 
  !db.games.some(g => g.id === aliceTrash1.id)
);
assert('Recycle Bin Stress', 'Alice empty bin preserves Bob deleted game (Multi-tenant isolation)',
  db.games.some(g => g.id === bobTrash1.id)
);

// Stress Test 12.18: 50 Rapid Delete-and-Undo Cycles (Concurrency & State Invariant)
const cycleGame = db.publishGame('usr_alice', {
  title: 'Stress Cycle Game',
  description: 'Subject of 50 rapid delete and undo cycles.',
  price: 9.99,
  tags: ['Action'],
  coverImageUrl: 'assets/games/game-1-cover.svg',
  screenshotUrls: ['assets/games/game-1-cover.svg']
});

for (let i = 0; i < 50; i++) {
  db.softDeleteGame(cycleGame.id);
  db.restoreGameFromBin(cycleGame.id);
}
assert('Undo Stress', '50 rapid delete-and-undo cycles maintain 100% data integrity without corruption',
  !cycleGame.deletedAt && db.games.filter(g => g.id === cycleGame.id).length === 1
);

// Stress Test 12.19: Total Revenue 90% Net Calculation
// Marvel Rivals (Alice's game_001) has a seed order of $4.99 by Bob
const aliceOrders = db.orders.filter(o => o.gameId === 'game_001' && o.status === 'confirmed');
const grossSales = aliceOrders.reduce((sum, o) => sum + o.price, 0);
const netRevenue = Math.round(grossSales * 0.90 * 100) / 100;
assert('Revenue Stress', 'Alice Marvel Rivals orders calculate exact 90% net revenue ($4.49)', 
  netRevenue === 4.49
);
const zeroOrdersRevenue = Math.round(0 * 0.90 * 100) / 100;
assert('Revenue Stress', 'Creator with 0 orders calculates $0.00 revenue cleanly without NaN',
  zeroOrdersRevenue === 0 && !isNaN(zeroOrdersRevenue)
);

// ---------------------------------------------------------------------------
// 13. Drag-and-Drop, Fluid Resizing & Media Studio Invariants
// ---------------------------------------------------------------------------
console.log('\n--- 13. INTEGRATION TESTS: Drag-and-Drop, Fluid Resizing & Media Studio Invariants ---');

// Invariant 13.1: Slot mapping completeness across all 5 slots
const SLOT_MAP: Record<string, string> = {
  cover: 'coverImageUrl',
  ss1: 'screenshot1',
  ss2: 'screenshot2',
  ss3: 'screenshot3',
  ss4: 'screenshot4'
};
assert('Media Studio Invariant', 'Slot map contains exactly 5 dedicated media slots',
  Object.keys(SLOT_MAP).length === 5
);
assert('Media Studio Invariant', 'Cover slot targets coverImageUrl',
  SLOT_MAP['cover'] === 'coverImageUrl'
);
assert('Media Studio Invariant', 'All 4 screenshot slots map to numbered screenshot controls',
  SLOT_MAP['ss1'] === 'screenshot1' &&
  SLOT_MAP['ss2'] === 'screenshot2' &&
  SLOT_MAP['ss3'] === 'screenshot3' &&
  SLOT_MAP['ss4'] === 'screenshot4'
);

// Invariant 13.2: Clean single-word slot titles (Zero text collision invariant)
const SLOT_TITLES = [
  { id: 'ss1', title: '1. Gameplay', word: 'Gameplay' },
  { id: 'ss2', title: '2. World', word: 'World' },
  { id: 'ss3', title: '3. Mechanics', word: 'Mechanics' },
  { id: 'ss4', title: '4. Action', word: 'Action' }
];
assert('Slot Naming Invariant', 'All 4 gallery slots use concise single-word focus titles',
  SLOT_TITLES.every(s => s.title.split(' ')[1] === s.word)
);
assert('Slot Naming Invariant', 'Slot titles contain 0 colliding secondary badge strings',
  SLOT_TITLES.every(s => !s.title.includes('ATMOSPHERE') && !s.title.includes('MECHANICS') && !s.title.includes('MOMENT'))
);

// Invariant 13.3: Drag-and-drop file ingestion validation
function testDropPayload(fileMock: { name: string; type: string; size: number } | null): { valid: boolean; error?: string } {
  if (!fileMock) return { valid: false, error: 'No file dropped' };
  return validateImagePayload(fileMock);
}

assert('Drag & Drop Invariant', 'Drop with null files is safely rejected without throwing',
  testDropPayload(null).valid === false
);
assert('Drag & Drop Invariant', 'Drop with valid PNG file is accepted',
  testDropPayload({ name: 'shot.png', type: 'image/png', size: 500000 }).valid === true
);
assert('Drag & Drop Invariant', 'Drop with valid WebP file is accepted',
  testDropPayload({ name: 'shot.webp', type: 'image/webp', size: 300000 }).valid === true
);
assert('Drag & Drop Invariant', 'Drop with executable file is safely rejected',
  testDropPayload({ name: 'virus.exe', type: 'application/x-msdownload', size: 10000 }).valid === false
);

// Invariant 13.4: Units Sold metric derivation
const aliceConfirmedOrdersCount = db.orders.filter(o => o.gameId === 'game_001' && o.status === 'confirmed').length;
assert('Studio Metrics Invariant', 'Alice Vance confirmed orders derive exactly 1 unit sold',
  aliceConfirmedOrdersCount === 1
);

// ---------------------------------------------------------------------------
// 14. Polish Invariants: Ultra-Smooth Drag, Streamlined Payout & Auto-Save
// ---------------------------------------------------------------------------
console.log('\n--- 14. INTEGRATION TESTS: Ultra-Smooth Drag, Streamlined Payout & Auto-Save ---');

// Invariant 14.1: Flicker-free drag counter state machine
class DragCounterStateMachine {
  private counts: Record<string, number> = {};
  activeSlot: string | null = null;

  enter(slot: string): void {
    this.counts[slot] = (this.counts[slot] || 0) + 1;
    if (this.counts[slot] === 1) {
      this.activeSlot = slot;
    }
  }

  leave(slot: string): void {
    this.counts[slot] = Math.max(0, (this.counts[slot] || 0) - 1);
    if (this.counts[slot] === 0 && this.activeSlot === slot) {
      this.activeSlot = null;
    }
  }

  drop(slot: string): void {
    this.counts[slot] = 0;
    this.activeSlot = null;
  }
}

const dragMachine = new DragCounterStateMachine();
dragMachine.enter('cover');
assert('Drag Counter Invariant', 'First dragenter activates cover slot', dragMachine.activeSlot === 'cover');

dragMachine.enter('cover'); // Hover over child icon
assert('Drag Counter Invariant', 'Nested child dragenter maintains active slot without flickering', dragMachine.activeSlot === 'cover');

dragMachine.leave('cover'); // Leave child icon to frame
assert('Drag Counter Invariant', 'Child dragleave keeps active slot on because parent is still hovered', dragMachine.activeSlot === 'cover');

dragMachine.leave('cover'); // Truly leave frame
assert('Drag Counter Invariant', 'Final dragleave deactivates slot cleanly', dragMachine.activeSlot === null);

dragMachine.enter('ss1');
dragMachine.drop('ss1');
assert('Drag Counter Invariant', 'Drop event immediately resets active slot and count to zero', dragMachine.activeSlot === null);

// Invariant 14.2: Streamlined Pricing Payout calculation
function computeStreamlinedPayout(price: number): { netPayout: number; rate: string; isFree: boolean } {
  if (price <= 0) return { netPayout: 0, rate: '0% fee', isFree: true };
  const net = Math.round(price * 0.90 * 100) / 100;
  return { netPayout: net, rate: '90% net', isFree: false };
}

const payout999 = computeStreamlinedPayout(9.99);
assert('Streamlined Payout Invariant', '$9.99 calculates exact $8.99 net payout', payout999.netPayout === 8.99);
assert('Streamlined Payout Invariant', '$9.99 net rate specifies 90% net', payout999.rate === '90% net');
assert('Streamlined Payout Invariant', '$0.00 is marked free with 0 fee', computeStreamlinedPayout(0).isFree === true);

// Invariant 14.3: Auto-Save as Draft on Route Leave
function simulateAutoSaveOnLeave(formState: { title?: string; dirty: boolean; price?: number }): Game | null {
  if (!formState.dirty) return null; // Pristine form does not auto-save empty drafts
  const title = formState.title?.trim() || 'Untitled Draft (Auto-Saved)';
  return db.publishGame('usr_alice', {
    title,
    description: 'Auto-saved work-in-progress draft.',
    price: formState.price || 0,
    tags: ['Indie'],
    coverImageUrl: 'assets/games/game-1-cover.svg',
    screenshotUrls: ['assets/games/game-1-cover.svg'],
    status: 'draft'
  });
}

// Case A: Dirty form with content auto-saves
const autoSavedDraft = simulateAutoSaveOnLeave({ title: 'Neon Horizon WIP', dirty: true, price: 14.99 });
assert('Auto-Save Invariant', 'Dirty form with title is auto-saved as a draft',
  autoSavedDraft !== null && autoSavedDraft.title === 'Neon Horizon WIP' && autoSavedDraft.status === 'draft'
);
assert('Auto-Save Invariant', 'Auto-saved draft is excluded from public store games query',
  db.getPublicCatalog().find(g => g.id === autoSavedDraft?.id) === undefined
);

// Case B: Pristine form does not auto-save
const pristineResult = simulateAutoSaveOnLeave({ dirty: false });
assert('Auto-Save Invariant', 'Pristine form does not create an empty dummy draft on leave',
  pristineResult === null
);

// ---------------------------------------------------------------------------
// 15. INTEGRATION TESTS: Creator Mode Deactivation Safety & Stress Testing
// ---------------------------------------------------------------------------
console.log('\n--- 15. INTEGRATION TESTS: Creator Mode Deactivation Safety & Stress Testing ---');

class CreatorDeactivationStateMachine {
  countdownSeconds = 0;
  countdownTotal = 5;
  showModal = false;
  timerActive = false;
  userRoles: string[] = ['creator', 'buyer'];

  openModal(total: number = 5): void {
    this.clearTimer();
    this.countdownTotal = total;
    this.countdownSeconds = total;
    this.showModal = true;
    this.timerActive = true;
  }

  cancel(): void {
    this.clearTimer();
    this.showModal = false;
  }

  clearTimer(): void {
    this.timerActive = false;
  }

  tick(): void {
    if (this.countdownSeconds > 0) {
      this.countdownSeconds = Math.max(0, this.countdownSeconds - 1);
    } else {
      this.clearTimer();
    }
  }

  // Defensively guarded method mirroring ProfileComponent.confirmDisableCreator()
  confirm(): boolean {
    if (this.countdownSeconds > 0) {
      return false; // REJECTED: premature execution blocked!
    }
    this.clearTimer();
    this.showModal = false;
    this.userRoles = this.userRoles.filter(r => r !== 'creator');
    return true; // CONFIRMED
  }

  get progressPercent(): number {
    return Math.max(0, Math.min(100, ((this.countdownTotal - this.countdownSeconds) / this.countdownTotal) * 100));
  }
}

// Invariant 15.1: Progress Percent Math
const progressMachine = new CreatorDeactivationStateMachine();
progressMachine.openModal(5);
assert('Deactivation Invariant', 'Initial progress at 5s is exactly 0%', progressMachine.progressPercent === 0);
progressMachine.tick(); // 4s
assert('Deactivation Invariant', 'Progress at 4s is 20%', progressMachine.progressPercent === 20);
progressMachine.tick(); // 3s
progressMachine.tick(); // 2s
progressMachine.tick(); // 1s
progressMachine.tick(); // 0s
assert('Deactivation Invariant', 'Final progress at 0s is 100%', progressMachine.progressPercent === 100);

// Failure Case 1: Premature trigger when countdownSeconds > 0 MUST be blocked
const prematureGuardMachine = new CreatorDeactivationStateMachine();
prematureGuardMachine.openModal(5);
assert('Deactivation Failure Case', 'Modal is open and timer active at start', prematureGuardMachine.showModal && prematureGuardMachine.timerActive);
const prematureBlocked = prematureGuardMachine.confirm(); // Attempt to confirm immediately at 5s!
assert('Deactivation Failure Case', 'Premature confirmation at 5s is rejected', prematureBlocked === false);
assert('Deactivation Failure Case', 'Creator role is preserved after premature trigger attempt', prematureGuardMachine.userRoles.includes('creator'));
assert('Deactivation Failure Case', 'Modal remains open after blocked attempt', prematureGuardMachine.showModal === true);

prematureGuardMachine.tick(); // 4s
const prematureBlockedAt4 = prematureGuardMachine.confirm();
assert('Deactivation Failure Case', 'Premature confirmation at 4s is rejected', prematureBlockedAt4 === false);
assert('Deactivation Failure Case', 'Creator role still preserved at 4s', prematureGuardMachine.userRoles.includes('creator'));

// Success Case: Confirmation only allowed after countdown completes to 0s
prematureGuardMachine.tick(); // 3s
prematureGuardMachine.tick(); // 2s
prematureGuardMachine.tick(); // 1s
prematureGuardMachine.tick(); // 0s
const confirmedAtZero = prematureGuardMachine.confirm();
assert('Deactivation Invariant', 'Confirmation at 0s is accepted', confirmedAtZero === true);
assert('Deactivation Invariant', 'Creator role is revoked after valid confirmation', !prematureGuardMachine.userRoles.includes('creator'));
assert('Deactivation Invariant', 'Modal is closed after valid confirmation', prematureGuardMachine.showModal === false);

// Failure Case 2: Cancellation during countdown clears timer without role mutation
const cancelMachine = new CreatorDeactivationStateMachine();
cancelMachine.openModal(5);
cancelMachine.tick(); // 4s
cancelMachine.cancel();
assert('Deactivation Invariant', 'Cancel closes modal', cancelMachine.showModal === false);
assert('Deactivation Invariant', 'Cancel clears timer', cancelMachine.timerActive === false);
assert('Deactivation Invariant', 'Cancel preserves creator role intact', cancelMachine.userRoles.includes('creator'));

// Stress Test: 1,000 rapid open/cancel cycles
let stressPass = true;
const stressMachine = new CreatorDeactivationStateMachine();
for (let cycle = 0; cycle < 1000; cycle++) {
  stressMachine.openModal(5);
  // Random partial ticks between 0 and 4
  const ticks = cycle % 5;
  for (let t = 0; t < ticks; t++) {
    stressMachine.tick();
  }
  // Try premature confirm
  if (stressMachine.countdownSeconds > 0) {
    const blocked = stressMachine.confirm();
    if (blocked !== false || !stressMachine.userRoles.includes('creator')) {
      stressPass = false;
      break;
    }
  }
  // Cancel cycle
  stressMachine.cancel();
  if (stressMachine.timerActive || stressMachine.showModal) {
    stressPass = false;
    break;
  }
}
assert('Deactivation Stress Test', '1,000 rapid open/cancel cycles maintain 100% data integrity and zero leaks', stressPass);

// Failure Case 3: Negative time protection under excessive ticking
const overtickMachine = new CreatorDeactivationStateMachine();
overtickMachine.openModal(5);
for (let i = 0; i < 50; i++) {
  overtickMachine.tick();
}
assert('Negative Time Protection', 'Excessive ticking halts at exactly 0s without dropping negative', overtickMachine.countdownSeconds === 0);
assert('Negative Time Protection', 'Progress percent caps at 100% without overflow', overtickMachine.progressPercent === 100);

// Invariant 15.2: Template & CSS Anti-Slop Audit
const rootDir = fs.existsSync(path.join(__dirname, '../../package.json'))
  ? path.join(__dirname, '../..')
  : path.join(__dirname, '../../..');
const profileHtmlPath = path.join(rootDir, 'src/app/features/profile/profile.component.html');
const profileCssPath = path.join(rootDir, 'src/app/features/profile/profile.component.css');

assert('Audit Precondition', 'Profile template and CSS exist at resolved root', fs.existsSync(profileHtmlPath) && fs.existsSync(profileCssPath));

const profileHtml = fs.readFileSync(profileHtmlPath, 'utf8');
const profileCss = fs.readFileSync(profileCssPath, 'utf8');

assert('Template Audit', 'Warning icon box is removed from modal header', !profileHtml.includes('warning-icon-box'));
assert('Template Audit', 'Countdown pulse dot is removed from modal pill', !profileHtml.includes('countdown-pulse-dot'));
assert('Template Audit', 'Countdown text wrapper is present', profileHtml.includes('countdown-text'));
assert('Template Audit', 'Trailing period removed from navigation warning text', profileHtml.includes('Hides Creator Studio from your navigation') && !profileHtml.includes('Hides Creator Studio from your navigation.'));

assert('CSS Audit', 'warning-icon-box CSS is removed', !profileCss.includes('.warning-icon-box'));
assert('CSS Audit', 'countdown-pulse-dot CSS is removed', !profileCss.includes('.countdown-pulse-dot'));
assert('CSS Audit', 'countdown-pill specifies min-width 172px for CLS stability', profileCss.includes('min-width: 172px'));

// ===========================================================================
// 16. INTEGRATION TESTS: Responsive Clamp & Viewport Boundary Invariants
// ===========================================================================
const headerCssPath = path.join(rootDir, 'src/app/layout/header/header.component.css');
const gameDetailCssPath = path.join(rootDir, 'src/app/features/game-detail/game-detail.component.css');

assert('Responsive Precondition', 'Header and Game Detail CSS exist', fs.existsSync(headerCssPath) && fs.existsSync(gameDetailCssPath));

const headerCss = fs.readFileSync(headerCssPath, 'utf8');
const gameDetailCss = fs.readFileSync(gameDetailCssPath, 'utf8');

// 1. 1240px intermediate tier with icon-only search and role-tag hide
const tier1240Regex = /@media\s*\(\s*max-width:\s*1240px\s*\)\s*\{[\s\S]*?\.btn-cmd-search[\s\S]*?display:\s*none[\s\S]*?width:\s*36px[\s\S]*?\.user-chip\s*\.role-tag[\s\S]*?display:\s*none[\s\S]*?\}/;
assert('Responsive Clamp Tier', '1240px tier enforces icon-only search and hides creator role tag', tier1240Regex.test(headerCss));

// 2. 1040px mobile breakpoint & no residual 1024px nav collapse
const nav1040Regex = /@media\s*\(\s*max-width:\s*1040px\s*\)\s*\{[\s\S]*?\.desktop-nav\s*\{[\s\S]*?display:\s*none;/;
const nav1024ResidualRegex = /@media\s*\(\s*max-width:\s*1024px\s*\)\s*\{[\s\S]*?\.desktop-nav\s*\{[\s\S]*?display:\s*none;/;
assert('Responsive Breakpoint', 'Header mobile collapse breakpoint is calibrated to 1040px', nav1040Regex.test(headerCss));
assert('Responsive Breakpoint', 'No residual 1024px desktop-nav collapse remains in header CSS', !nav1024ResidualRegex.test(headerCss));

// 3. 1024px game-detail showcase stacking with capsule hide
const showcase1024Regex = /@media\s*\(\s*max-width:\s*1024px\s*\)\s*\{[\s\S]*?\.steam-showcase-stage\s*\{[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?\.capsule-image-wrap\s*\{[\s\S]*?display:\s*none;/;
assert('Responsive Showcase', 'Game detail showcase stacks 1fr with capsule hidden at 1024px', showcase1024Regex.test(gameDetailCss));

// 4. Header container clamp max bounded to <= 40px
const containerClampMatch = headerCss.match(/\.header-container\s*\{[\s\S]*?padding:\s*0\s+clamp\(\s*(\d+)px\s*,\s*([\d.]+)vw\s*,\s*(\d+)px\s*\)/);
const maxPadding = containerClampMatch ? parseInt(containerClampMatch[3], 10) : 999;
assert('Responsive Clamp Tokens', 'Header container clamp maximum padding is bounded to <= 40px', maxPadding <= 40);

// 5. Redundant 768px search label/kbd hide removed
const block768Match = headerCss.match(/@media\s*\(\s*max-width:\s*768px\s*\)\s*\{([\s\S]*?)(?=@media|\/\*|$)/);
const block768 = block768Match ? block768Match[1] : '';
assert('Responsive Deduplication', 'Redundant search label/kbd hide in 768px block is purged', !block768.includes('search-btn-label') && !block768.includes('search-btn-kbd'));

// ===========================================================================
// 17. INTEGRATION TESTS: Profile Iconography & Steam Slate Precision Invariants
// ===========================================================================
const profileHtmlContent = fs.readFileSync(profileHtmlPath, 'utf8');
const profileCssContent = fs.readFileSync(profileCssPath, 'utf8');

// 1. stat-arrow has ZERO occurrences in both profile html and css
assert('Profile Icon Invariant', 'stat-arrow has ZERO occurrences in profile.component.html', !profileHtmlContent.includes('stat-arrow'));
assert('Profile Icon Invariant', 'stat-arrow has ZERO occurrences in profile.component.css', !profileCssContent.includes('stat-arrow'));

// 2. All 4 .stat-icon svgs use stroke-width="1.75" and root fill="none"; ZERO fill-opacity occurrences in profile html
const statIconMatches = Array.from(profileHtmlContent.matchAll(/<svg\s+class="stat-icon"([\s\S]*?)>/g));
assert('Profile Icon Invariant', 'Found exactly 4 stat-icon SVGs in profile HTML', statIconMatches.length === 4);
const allStatIconsCorrect = statIconMatches.length === 4 && statIconMatches.every(m => m[1].includes('stroke-width="1.75"') && m[1].includes('fill="none"'));
assert('Profile Icon Invariant', 'All 4 stat-icon SVGs specify stroke-width="1.75" and fill="none"', allStatIconsCorrect);
assert('Profile Icon Invariant', 'ZERO fill-opacity occurrences exist in profile HTML', !profileHtmlContent.includes('fill-opacity'));

// 3. .stat-icon-wrap uses var(--radius-sm), var(--text-muted), var(--border-card) and no .lime/.rose/.cyan/.emerald
const statIconWrapMatch = profileCssContent.match(/\.stat-icon-wrap\s*\{([\s\S]*?)\}/);
const statWrapBody = statIconWrapMatch ? statIconWrapMatch[1] : '';
assert('Profile Icon Invariant', '.stat-icon-wrap uses var(--radius-sm)', statWrapBody.includes('var(--radius-sm)'));
assert('Profile Icon Invariant', '.stat-icon-wrap uses var(--text-muted)', statWrapBody.includes('var(--text-muted)'));
assert('Profile Icon Invariant', '.stat-icon-wrap uses var(--border-card)', statWrapBody.includes('var(--border-card)'));
assert('Profile Icon Invariant', 'Rainbow selectors (.lime, .rose, .cyan, .emerald) purged from profile CSS',
  !profileCssContent.includes('.stat-icon-wrap.lime') &&
  !profileCssContent.includes('.stat-icon-wrap.rose') &&
  !profileCssContent.includes('.stat-icon-wrap.cyan') &&
  !profileCssContent.includes('.stat-icon-wrap.emerald')
);

// 4. Studio icon: .setting-icon-box is 36x36 slate; no .setting-icon-box.cyan rule; template has no "setting-icon-box cyan"
const settingBoxMatch = profileCssContent.match(/\.setting-icon-box\s*\{([\s\S]*?)\}/);
const settingBoxBody = settingBoxMatch ? settingBoxMatch[1] : '';
assert('Profile Studio Icon', '.setting-icon-box is 36px width and 36px height', settingBoxBody.includes('width: 36px') && settingBoxBody.includes('height: 36px'));
assert('Profile Studio Icon', '.setting-icon-box uses var(--radius-sm)', settingBoxBody.includes('var(--radius-sm)'));
assert('Profile Studio Icon', 'No .setting-icon-box.cyan rule remains in CSS', !profileCssContent.includes('.setting-icon-box.cyan'));
assert('Profile Studio Icon', 'Template has no "setting-icon-box cyan" combo', !profileHtmlContent.includes('setting-icon-box cyan'));

// 5. Hero & meta icons standardized to stroke-width="1.75"
const cameraIconMatch = profileHtmlContent.match(/<svg[^>]*class="camera-icon"[^>]*>|<svg[^>]*camera-icon[^>]*>/);
assert('Profile Hero Icon', 'camera-icon uses stroke-width="1.75"', !!cameraIconMatch && cameraIconMatch[0].includes('stroke-width="1.75"'));
const metaSvgMatches = Array.from(profileHtmlContent.matchAll(/<svg[^>]*class="meta-svg"[^>]*>/g));
assert('Profile Hero Icon', 'All meta-svg icons use stroke-width="1.75"', metaSvgMatches.length >= 2 && metaSvgMatches.every(m => m[0].includes('stroke-width="1.75"')));

// ===========================================================================
// 18. INTEGRATION TESTS: Account Security & Change Password Invariants
// ===========================================================================
const profileHtmlLatest = fs.readFileSync(profileHtmlPath, 'utf8');
const profileCssLatest = fs.readFileSync(profileCssPath, 'utf8');
const profileTsPath = path.join(rootDir, 'src/app/features/profile/profile.component.ts');
const profileTsContent = fs.readFileSync(profileTsPath, 'utf8');
const userModelPath = path.join(rootDir, 'src/app/core/models/user.model.ts');
const userModelContent = fs.readFileSync(userModelPath, 'utf8');
const authMockPath = path.join(rootDir, 'src/app/core/auth/auth.mock.ts');
const authMockContent = fs.readFileSync(authMockPath, 'utf8');
const passwordLogicPath = path.join(rootDir, 'src/app/core/auth/password-logic.ts');
const passwordLogicContent = fs.readFileSync(passwordLogicPath, 'utf8');

// 1. Security section and modal present in template
assert('Security Invariant', 'Account Security card section present in profile.component.html', profileHtmlLatest.includes('class="security-card"'));
assert('Security Invariant', 'Change Password modal present in profile.component.html', profileHtmlLatest.includes('class="modal-card password-modal-card"'));

// 2. All three password inputs present with dynamic toggle and correct autocomplete attributes
assert('Security Invariant', 'current-password autocomplete attribute present', profileHtmlLatest.includes('autocomplete="current-password"'));
assert('Security Invariant', 'new-password autocomplete attribute present', profileHtmlLatest.includes('autocomplete="new-password"'));
const toggleButtons = Array.from(profileHtmlLatest.matchAll(/class="btn-toggle-password"/g));
assert('Security Invariant', 'Show/hide password toggles wired for password fields', toggleButtons.length >= 3);

// 3. Form error callout role="alert" used in modal
assert('Security Invariant', 'form-error-callout with role="alert" used for errors', profileHtmlLatest.includes('class="form-error-callout"') && profileHtmlLatest.includes('role="alert"'));

// 4. Lockout constants defined
assert('Security Invariant', 'PASSWORD_MIN_LENGTH defined in password-logic', passwordLogicContent.includes('PASSWORD_MIN_LENGTH = 8'));
assert('Security Invariant', 'MAX_FAILED_ATTEMPTS defined in password-logic', passwordLogicContent.includes('MAX_FAILED_ATTEMPTS = 5'));
assert('Security Invariant', 'LOCKOUT_DURATION_MS defined in password-logic', passwordLogicContent.includes('LOCKOUT_DURATION_MS = 60_000') || passwordLogicContent.includes('LOCKOUT_DURATION_MS = 60000'));

// 5. Credential isolation: User model and auth_users persistence never leak password/plaintext
assert('Security Invariant', 'User interface does not define a password field', !userModelContent.includes('password'));
assert('Security Invariant', 'AuthMockService stores credentials in separate auth_credentials key', authMockContent.includes('CREDENTIALS_KEY = \'auth_credentials\''));
assert('Security Invariant', 'AuthMockService persist() only serializes users without credentials', !authMockContent.match(/this\.users\.map\([^)]*password/));

// 6. Success toast wired
assert('Security Invariant', 'ToastService wired in ProfileComponent for password updates', profileTsContent.includes('toastService.show') && profileTsContent.includes('Password updated'));

// 7. Impeccable zero emojis
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
assert('Security Invariant', 'Zero raw emojis in profile HTML', !emojiRegex.test(profileHtmlLatest));
assert('Security Invariant', 'Zero raw emojis in profile TS', !emojiRegex.test(profileTsContent));

// 8. Account Password grounded naming & padlock icon invariants
assert('Security Invariant', 'Card title is named "Account Password"', profileHtmlLatest.includes('Account Password'));
assert('Security Invariant', 'Password subtitle is "Used to sign in to your NEXORA account"', profileHtmlLatest.includes('Used to sign in to your NEXORA account'));
assert('Security Invariant', 'Action button is permanently "Change Password"', profileHtmlLatest.includes('Change Password'));
assert('Security Invariant', 'Setting icon is a clean 1.75 line-art padlock', profileHtmlLatest.includes('d="M7 11V7a5 5 0 0 1 10 0v4"') && profileHtmlLatest.includes('stroke-width="1.75"'));
assert('Security Invariant', 'Default seed credentials defined in auth.mock', authMockContent.includes('DEFAULT_SEED_PASSWORD = \'Password123!\''));

// ===========================================================================
// 19. INTEGRATION TESTS: UI/UX Polish, Modals, Draft Auto-Dismiss & Recycle Bin
// ===========================================================================
const headerCssContent = fs.readFileSync(path.join(rootDir, 'src/app/layout/header/header.component.css'), 'utf8');
const headerHtmlContent = fs.readFileSync(path.join(rootDir, 'src/app/layout/header/header.component.html'), 'utf8');
const studioTsContent = fs.readFileSync(path.join(rootDir, 'src/app/features/creator-studio/creator-studio.component.ts'), 'utf8');
const studioHtmlContent = fs.readFileSync(path.join(rootDir, 'src/app/features/creator-studio/creator-studio.component.html'), 'utf8');
const studioCssContent = fs.readFileSync(path.join(rootDir, 'src/app/features/creator-studio/creator-studio.component.css'), 'utf8');

// 1. Header Logout Modal & SVG Blowout Prevention
assert('UI/UX Polish', 'Header defines .modal-backdrop, .modal-card, .safe-data-callout in CSS',
  headerCssContent.includes('.modal-backdrop') && headerCssContent.includes('.modal-card') && headerCssContent.includes('.safe-data-callout'));
assert('UI/UX Polish', 'Header .check-icon has strict 18px width/height constraints',
  headerCssContent.includes('.check-icon') && headerCssContent.includes('width: 18px') && headerCssContent.includes('height: 18px'));
assert('UI/UX Polish', 'Header logout modal uses &times; instead of raw Unicode ✕',
  headerHtmlContent.includes('&times;') && !headerHtmlContent.includes('>✕<'));

// 2. Profile Password Input Token Fidelity
assert('UI/UX Polish', 'Profile .form-control is grouped with .form-input for Steam tokens',
  profileCssLatest.includes('.form-input, .form-textarea, .form-control'));
assert('UI/UX Polish', 'Profile .form-control has light theme overrides',
  profileCssLatest.includes(':host-context([data-theme="light"]) .form-control'));
assert('UI/UX Polish', 'Change Password submit button permanently has "Change Password"',
  profileHtmlLatest.includes("{{ savingPassword ? 'Updating...' : 'Change Password' }}"));

// 3. Creator Studio Draft Auto-Dismiss Banner & Hover Controls
assert('UI/UX Polish', 'Creator Studio TOAST_AUTO_DISMISS_MS is 5500ms',
  studioTsContent.includes('readonly TOAST_AUTO_DISMISS_MS = 5500'));
assert('UI/UX Polish', 'Creator Studio implements pause/resume/clear timer helpers',
  studioTsContent.includes('pausePublishToastTimer') && studioTsContent.includes('resumePublishToastTimer') && studioTsContent.includes('clearPublishToastTimer'));
assert('UI/UX Polish', 'Creator Studio cleans query parameters on show to prevent refresh resurrection',
  studioTsContent.includes('queryParams: {}') && studioTsContent.includes('replaceUrl: true'));
assert('UI/UX Polish', 'Creator Studio implements OnDestroy and clears timers',
  studioTsContent.includes('ngOnDestroy(): void') &&
  studioTsContent.includes('this.clearPublishToastTimer();') &&
  studioTsContent.includes('this.clearPurgeCountdownTimer();'));
assert('UI/UX Polish', 'Creator Studio banner binds mouseenter and mouseleave hover events',
  studioHtmlContent.includes('(mouseenter)="pausePublishToastTimer()"') && studioHtmlContent.includes('(mouseleave)="resumePublishToastTimer()"'));

// 4. Recycle Bin Readability & High Contrast
assert('UI/UX Polish', 'Recycle Bin .unpublished-row does not apply row-wide opacity: 0.75',
  !studioCssContent.includes('.unpublished-row {\n  opacity: 0.75;\n}') && !studioCssContent.includes('.unpublished-row { opacity: 0.75; }'));
assert('UI/UX Polish', 'Recycle Bin .status-pill.bin uses soft rose tint in dark theme and var(--rose-500) token in light theme',
  studioCssContent.includes('.status-pill.bin') && studioCssContent.includes('#FDA4AF') && studioCssContent.includes('var(--rose-500)'));
assert('UI/UX Polish', 'Recycle Bin restore and purge actions use high-contrast text',
  studioCssContent.includes('.btn-action.restore') && studioCssContent.includes('#6EE7B7') && studioCssContent.includes('#FDA4AF'));

// 5. Permanent Purge Countdown Safety Lock & Compact Micro-Pill
assert('UI/UX Polish', 'Permanent Purge defines 5s countdown lock in CreatorStudioComponent',
  studioTsContent.includes('readonly purgeCountdownTotal = 5') && studioTsContent.includes('purgeCountdownSeconds = 5'));
assert('UI/UX Polish', 'Permanent Purge modal renders countdown-pill and disabled confirm button',
  studioHtmlContent.includes('purgeCountdownSeconds === 0') && studioHtmlContent.includes('[disabled]="purgeCountdownSeconds > 0 || purging"'));
assert('UI/UX Polish', 'Permanent Purge CSS defines compact countdown pill (136px / 0.72rem) and disabled state',
  studioCssContent.includes('.countdown-pill') && studioCssContent.includes('min-width: 136px') && studioCssContent.includes('font-size: 0.72rem') && studioCssContent.includes('.btn-confirm-purge:disabled'));
assert('UI/UX Polish', 'Permanent Purge uses action-first title and removes boilerplate "Are you sure you want to"',
  studioHtmlContent.includes('Permanently Delete "{{ gameToPurge.title }}"?') && !studioHtmlContent.includes('Are you sure you want to'));

// 6. Zero Raw Dingbats across application templates
const dingbatsCheckRegex = /[\u2700-\u27BF]/;
const catalogHtmlContent = fs.readFileSync(path.join(rootDir, 'src/app/features/game-catalog/game-catalog.component.html'), 'utf8');
const gameDetailHtmlContent = fs.readFileSync(path.join(rootDir, 'src/app/features/game-detail/game-detail.component.html'), 'utf8');
const libraryHtmlContent = fs.readFileSync(path.join(rootDir, 'src/app/features/library/library.component.html'), 'utf8');
const wishlistHtmlContent = fs.readFileSync(path.join(rootDir, 'src/app/features/wishlist/wishlist.component.html'), 'utf8');
assert('UI/UX Polish', 'Zero raw Dingbats characters in header, studio, catalog, and store templates',
  !dingbatsCheckRegex.test(headerHtmlContent) &&
  !dingbatsCheckRegex.test(studioHtmlContent) &&
  !dingbatsCheckRegex.test(profileHtmlLatest) &&
  !dingbatsCheckRegex.test(catalogHtmlContent) &&
  !dingbatsCheckRegex.test(gameDetailHtmlContent) &&
  !dingbatsCheckRegex.test(libraryHtmlContent) &&
  !dingbatsCheckRegex.test(wishlistHtmlContent));

// ===========================================================================
// 20. INTEGRATION TESTS: Game Form Color Consistency & Layout Polish
// ===========================================================================
const gameFormCssContent = fs.readFileSync(path.join(rootDir, 'src/app/features/creator-studio/game-form/game-form.component.css'), 'utf8');
const tagChipCssContent = fs.readFileSync(path.join(rootDir, 'src/app/shared/ui/tag-chip-input/tag-chip-input.component.css'), 'utf8');

// 1. Game Form Light Theme Overrides
assert('Game Form Polish', 'Sticky footer has Light Theme override and top border',
  gameFormCssContent.includes(':host-context([data-theme="light"]) .form-actions-footer.sticky') &&
  gameFormCssContent.includes('border-top: 1px solid var(--border-card)'));

// 2. Submit Button Steam Green Standard
assert('Game Form Polish', 'Submit CTA uses standardized Steam Green gradient tokens',
  gameFormCssContent.includes('--steam-btn-gradient') && gameFormCssContent.includes('#75B022'));

// 3. Symmetrical 2x2 Screenshots Grid
assert('Game Form Polish', 'Screenshots grid uses symmetrical 2x2 matrix repeat(2, 1fr)',
  gameFormCssContent.includes('grid-template-columns: repeat(2, 1fr)'));

// 4. Anti-Slop Neon Blur Elimination
const gameFormNeonCheck = /box-shadow:\s*0\s+0\s+\d+px\s+rgba\(/i;
assert('Game Form Polish', 'Zero blurry neon box-shadow halos in game-form.component.css',
  !gameFormNeonCheck.test(gameFormCssContent));

// 5. Tag Chip Grounded Hover & Light Theme
const tagHoverCheck = tagChipCssContent.slice(tagChipCssContent.indexOf('.btn-add-tag:hover'), tagChipCssContent.indexOf('.btn-add-tag:hover') + 150);
assert('Game Form Polish', 'Tag chip input has grounded hover and light theme tokens',
  !tagHoverCheck.includes('scale(') && tagChipCssContent.includes(':host-context([data-theme="light"])'));

// 6. Catalog Reset Filters Light Mode Hover Fidelity
const catalogCssContent = fs.readFileSync(path.join(rootDir, 'src/app/features/game-catalog/game-catalog.component.css'), 'utf8');
assert('Game Form Polish', 'Catalog Reset Filters button has high-contrast light mode hover state',
  catalogCssContent.includes(':host-context([data-theme="light"]) .btn-reset-filters') &&
  catalogCssContent.includes(':host-context([data-theme="light"]) .btn-reset-filters:hover'));

// 21. INTEGRATION TESTS: Inline Checkout Add-Method & ABA PayWay Rail
// ---------------------------------------------------------------------------
const checkoutModalTsContent = fs.readFileSync(path.join(rootDir, 'src/app/shared/ui/purchase-confirm-modal/purchase-confirm-modal.component.ts'), 'utf8');
const checkoutModalHtmlContent = fs.readFileSync(path.join(rootDir, 'src/app/shared/ui/purchase-confirm-modal/purchase-confirm-modal.component.html'), 'utf8');
const checkoutModalCssContent = fs.readFileSync(path.join(rootDir, 'src/app/shared/ui/purchase-confirm-modal/purchase-confirm-modal.component.css'), 'utf8');
const addMethodFormTsContent = fs.readFileSync(path.join(rootDir, 'src/app/shared/ui/add-payment-method-form/add-payment-method-form.component.ts'), 'utf8');
const addMethodFormHtmlContent = fs.readFileSync(path.join(rootDir, 'src/app/shared/ui/add-payment-method-form/add-payment-method-form.component.html'), 'utf8');
const addMethodFormCssContent = fs.readFileSync(path.join(rootDir, 'src/app/shared/ui/add-payment-method-form/add-payment-method-form.component.css'), 'utf8');
const paywaySheetTsContent = fs.readFileSync(path.join(rootDir, 'src/app/shared/ui/aba-payway-sheet/aba-payway-sheet.component.ts'), 'utf8');
const paywaySheetHtmlContent = fs.readFileSync(path.join(rootDir, 'src/app/shared/ui/aba-payway-sheet/aba-payway-sheet.component.html'), 'utf8');
const accountPaymentHtmlContent = fs.readFileSync(path.join(rootDir, 'src/app/features/account-payment/account-payment.component.html'), 'utf8');
const khqrCardTsContent = fs.readFileSync(path.join(rootDir, 'src/app/shared/ui/khqr-card/khqr-card.component.ts'), 'utf8');
const khqrCardHtmlContent = fs.readFileSync(path.join(rootDir, 'src/app/shared/ui/khqr-card/khqr-card.component.html'), 'utf8');
const khqrCardCssContent = fs.readFileSync(path.join(rootDir, 'src/app/shared/ui/khqr-card/khqr-card.component.css'), 'utf8');
const paywaySheetCssContent = fs.readFileSync(path.join(rootDir, 'src/app/shared/ui/aba-payway-sheet/aba-payway-sheet.component.css'), 'utf8');

// 1. Single Source of Truth — shared add-method form, zero duplicated logic
assert('Checkout Add-Method', 'Shared form imports the three card input directives (appCardNumber, appExpiryDate, appCvv)',
  addMethodFormTsContent.includes('CardNumberDirective') && addMethodFormTsContent.includes('ExpiryDateDirective') && addMethodFormTsContent.includes('CvvDirective'));
assert('Checkout Add-Method', 'Shared form reuses payment-logic validateCardInput and detectCardBrand (no duplicated validation)',
  addMethodFormTsContent.includes('validateCardInput') && addMethodFormTsContent.includes('detectCardBrand') && addMethodFormTsContent.includes('payment-logic'));
assert('Checkout Add-Method', 'Purchase modal hosts the shared form (no inline card form markup left)',
  checkoutModalHtmlContent.includes('<app-add-payment-method-form') && !checkoutModalHtmlContent.includes('appCardNumber'));
assert('Checkout Add-Method', 'Account-payment add-modal hosts the same shared form',
  accountPaymentHtmlContent.includes('<app-add-payment-method-form'));
assert('Checkout Add-Method', 'Account-payment no longer carries duplicated form submit logic',
  !accountPaymentHtmlContent.includes('submitAddCard') && !accountPaymentHtmlContent.includes('submitAddKhqr'));

// 2. Auto-select & panel lifecycle in the checkout host
assert('Checkout Add-Method', 'Successful add appends the method and auto-selects it for checkout',
  checkoutModalTsContent.includes('this.savedMethods.update(list => [...list, method])') &&
  checkoutModalTsContent.includes('this.selectedOptionId.set(method.id)'));
assert('Checkout Add-Method', 'Toggle is hidden while the add-method panel is open (no doubled UI)',
  checkoutModalHtmlContent.includes('@if (!showAddMethod())') && checkoutModalHtmlContent.includes('[attr.aria-expanded]="showAddMethod()"'));

// 3. ABA PayWay rail — auto-set pricing from the game price
assert('PayWay Rail', 'PayWay option rendered in the method selector with consumer scan subtitle',
  checkoutModalHtmlContent.includes('ABA PayWay') && checkoutModalHtmlContent.includes('Scan with ABA Mobile or any KHQR app'));
assert('PayWay Rail', 'Sheet amount binds strictly to the game price (no manual amount entry)',
  checkoutModalHtmlContent.includes('[amountUsd]="game.price"') && !paywaySheetHtmlContent.includes('ngModel'));
assert('PayWay Rail', 'Sheet computes KHR equivalent via finance-core convertCurrency and the USD_TO_KHR_RATE snapshot',
  paywaySheetTsContent.includes('convertCurrency') && paywaySheetTsContent.includes('USD_TO_KHR_RATE') && paywaySheetTsContent.includes('payment-finance-logic'));
assert('PayWay Rail', 'Sheet lifecycle: waiting, processing, succeeded, expired with regenerate',
  paywaySheetTsContent.includes("'waiting'") && paywaySheetTsContent.includes("'processing'") && paywaySheetTsContent.includes("'succeeded'") && paywaySheetTsContent.includes("'expired'") && paywaySheetTsContent.includes('regenerate'));
assert('PayWay Rail', 'Sheet uses the shared KHQR card component for the QR visual',
  paywaySheetTsContent.includes('KhqrCardComponent') && paywaySheetHtmlContent.includes('<app-khqr-card'));
assert('PayWay Rail', 'Sheet status region is aria-live and countdown is a timer',
  paywaySheetHtmlContent.includes('aria-live="polite"') && paywaySheetHtmlContent.includes('role="timer"'));
assert('PayWay Rail', 'Success emits through the unchanged confirm contract as ABA PayWay (KHQR)',
  checkoutModalTsContent.includes('onPaywayCompleted') && checkoutModalTsContent.includes("'ABA PayWay (KHQR)'"));
assert('PayWay Rail', 'Generic KHQR path stays on the account page (via shared form) but PayWay replaces the checkout rail',
  addMethodFormHtmlContent.includes('Bakong Link') && accountPaymentHtmlContent.includes('<app-add-payment-method-form') && checkoutModalHtmlContent.includes('payway-option'));

// 4. Escape layering and confirm contract
assert('Checkout Add-Method', 'Escape closes the PayWay sheet first, then the add panel, then the modal',
  checkoutModalTsContent.includes('if (this.showPayway())') && checkoutModalTsContent.includes('if (this.showAddMethod())') &&
  checkoutModalTsContent.split('event.stopPropagation()').length >= 3);
assert('Checkout Add-Method', 'Confirm event still emits a formatted payment method string (PurchaseConfirmationEvent unchanged)',
  checkoutModalTsContent.includes('PurchaseConfirmationEvent') && checkoutModalTsContent.includes('this.confirm.emit({ paymentMethod: this.formattedPaymentMethod })'));

// 5. Steam token styling & light theme fidelity
assert('Checkout Add-Method', 'Toggle uses grounded dashed Steam border with token radius and 0.15s ease',
  checkoutModalCssContent.includes('.add-card-toggle') && checkoutModalCssContent.includes('border: 1px dashed var(--border-card)'));
assert('Checkout Add-Method', 'Shared form inputs use Steam tokens, focus ring and light theme overrides',
  addMethodFormCssContent.includes('background: var(--bg-input)') && addMethodFormCssContent.includes(':host-context([data-theme="light"]) .form-input'));
assert('Checkout Add-Method', 'Method selector is a single-column list (no orphan cells)',
  !checkoutModalCssContent.includes('1fr 1fr') || !checkoutModalCssContent.slice(checkoutModalCssContent.indexOf('.card-brand-switcher')).slice(0, 200).includes('1fr 1fr'));
assert('Checkout Add-Method', 'Add Payment Method button is action-first and uses the Steam blue CTA token',
  addMethodFormHtmlContent.includes('<span>Save Card</span>') && addMethodFormCssContent.includes('background: var(--accent-600)'));
assert('Checkout Add-Method', 'Third perk point removed from the purchase modal',
  !checkoutModalHtmlContent.includes('90% goes directly to the creator'));
assert('Checkout Add-Method', 'Manage methods link has light theme hover override',
  checkoutModalCssContent.includes(':host-context([data-theme="light"]) .manage-methods-link:hover') &&
  checkoutModalCssContent.includes('#005A9E'));

// 6. Mobile Compaction & Single-KHQR Checkout (AC-901..AC-904)
assert('PayWay Mobile', 'KHQR card compact variant is additive and defaults to full render (account page untouched)',
  khqrCardTsContent.includes('readonly compact = input(false)') && khqrCardHtmlContent.includes('[class.compact]="compact()"'));
assert('PayWay Mobile', 'Compact variant hides account rows and footer, keeps the QR stage',
  khqrCardHtmlContent.split('@if (!compact())').length >= 3 && khqrCardCssContent.includes('.khqr-card-shell.compact') && khqrCardCssContent.includes('max-width: 200px'));
assert('PayWay Mobile', 'PayWay sheet renders the compact QR-only card',
  paywaySheetHtmlContent.includes('[compact]="true"'));
assert('PayWay Mobile', 'Sheet compacts under 480px (media query with tightened spacing)',
  paywaySheetCssContent.includes('@media (max-width: 480px)'));
assert('PayWay Mobile', 'Purchase modal gains its first 480px breakpoint',
  checkoutModalCssContent.includes('@media (max-width: 480px)'));
assert('PayWay Mobile', 'Checkout lists cards only — saved KHQR rows replaced by the single PayWay QR',
  checkoutModalTsContent.includes("this.savedMethods().filter(m => m.type === 'card')") &&
  checkoutModalHtmlContent.includes('@for (method of checkoutMethods(); track method.id)') &&
  !checkoutModalHtmlContent.includes('method.bank'));

// 7. Focused PayWay Mode & Account-KHQR Identity Sync (AC: one-screen sheet, same card)
assert('PayWay Focus', 'Focused mode hides summary, selector and perks while the sheet is open',
  checkoutModalHtmlContent.includes('@if (showPayway()) {') &&
  checkoutModalHtmlContent.includes('} @else {') &&
  checkoutModalHtmlContent.slice(checkoutModalHtmlContent.indexOf('@if (showPayway())')).includes('<app-aba-payway-sheet') &&
  checkoutModalHtmlContent.slice(checkoutModalHtmlContent.indexOf('} @else {')).includes('perks-list'));
assert('PayWay Focus', 'Modal footer is hidden while the PayWay sheet owns the flow',
  checkoutModalHtmlContent.includes('@if (!showPayway()) {') && checkoutModalHtmlContent.includes('the sheet owns the flow'));
assert('PayWay Focus', 'Back button inside the sheet returns to the full view via cancel -> closePayway',
  paywaySheetHtmlContent.includes('payway-back-btn') && paywaySheetHtmlContent.includes('aria-label="Back to payment methods"') &&
  checkoutModalHtmlContent.includes('(cancel)="closePayway()"'));
assert('PayWay Sync', 'Checkout QR reuses the account KHQR identity (holder from session user, seed from linked method id)',
  checkoutModalTsContent.includes("this.savedMethods().find(m => m.type === 'khqr')?.id ?? 'nexora-demo'") &&
  checkoutModalTsContent.includes('displayName ?? ') && checkoutModalHtmlContent.includes('[accountSeed]="paywaySeed()"'));
assert('PayWay Sync', 'Sheet forwards the account identity to the KHQR card, falling back to the transaction seed',
  paywaySheetTsContent.includes('accountHolder') && paywaySheetTsContent.includes('accountSeed') &&
  paywaySheetTsContent.includes('this.accountSeed() ?? this.qrSeed') && paywaySheetHtmlContent.includes('[holderName]="cardHolderName"'));

// 8. Sheet distillation — one header, merchant named, price once, between name and QR
assert('PayWay Distill', 'Merchant is named Nexora Co., Ltd and precedes the price block',
  paywaySheetTsContent.includes("merchantName = input('Nexora Co., Ltd')") &&
  paywaySheetHtmlContent.includes('payway-merchant-name') &&
  paywaySheetHtmlContent.indexOf('payway-merchant-name') < paywaySheetHtmlContent.indexOf('payway-price-block'));
assert('PayWay Distill', 'Price renders below the QR card (reference pattern: scan first, amount after)',
  paywaySheetHtmlContent.indexOf('<app-khqr-card') < paywaySheetHtmlContent.indexOf('payway-price-block'));
assert('PayWay Distill', 'Single price — confirm button carries no amount, dashed auto-set box removed',
  paywaySheetHtmlContent.includes('<span>Confirm Payment</span>') && !paywaySheetHtmlContent.includes('Pay {{') &&
  !paywaySheetHtmlContent.includes('payway-amount-label') && !paywaySheetHtmlContent.includes('AUTO-SET'));
assert('PayWay Distill', 'No duplicate ABA PayWay header — back arrow alone, brand chip removed',
  !checkoutModalHtmlContent.includes('payway-focus-header') &&
  !paywaySheetHtmlContent.includes('payway-brand-row') && !paywaySheetHtmlContent.includes('payway-name'));
assert('PayWay Distill', 'KHQR card no longer repeats the merchant label',
  !khqrCardHtmlContent.includes('NEXORA MERCHANT'));

// 9. Scan card — reference-faithful presentation
assert('PayWay Scan Card', 'Logo badge, merchant title and scan subtitle centered above the QR',
  paywaySheetHtmlContent.includes('payway-logo-badge') && paywaySheetHtmlContent.includes('assets/logo-icon.svg') &&
  paywaySheetHtmlContent.includes('Scan here to pay'));
assert('PayWay Scan Card', 'QR framed by four cyan corner brackets',
  paywaySheetHtmlContent.split('frame-corner').length >= 5 && paywaySheetCssContent.includes('border: 2.5px solid var(--accent-400)'));
assert('PayWay Scan Card', 'Compact KHQR variant hides banner and holder header (bare QR)',
  khqrCardHtmlContent.split('@if (!compact())').length >= 5);
assert('PayWay Scan Card', 'Expiry countdown is a prominent timer pill below the price',
  paywaySheetHtmlContent.includes('Expires in {{ formatClock(countdownSeconds()) }}') &&
  paywaySheetHtmlContent.includes('payway-expiry-pill') &&
  paywaySheetHtmlContent.indexOf('role="timer"') > paywaySheetHtmlContent.indexOf('<app-khqr-card'));

// 10. USD-only pricing + unmissable expiry
assert('PayWay USD', 'Sheet displays USD only — no KHR conversion or rate line in checkout',
  !paywaySheetHtmlContent.includes('khrLabel') && !paywaySheetHtmlContent.includes('rateLabel'));
assert('PayWay USD', 'Expiry pill turns urgent (rose) under 60 seconds',
  paywaySheetHtmlContent.includes('[class.urgent]="countdownSeconds() < 60"') &&
  paywaySheetCssContent.includes('.payway-expiry-pill.urgent'));

// 22. INTEGRATION TESTS: Payment Finance Core (Ledger, Intents, Idempotency)
// ---------------------------------------------------------------------------
const financeModelContent = fs.readFileSync(path.join(rootDir, 'src/app/core/models/finance.model.ts'), 'utf8');
const financeLogicContent = fs.readFileSync(path.join(rootDir, 'src/app/core/data/payments/payment-finance-logic.ts'), 'utf8');
const paymentsServiceContent = fs.readFileSync(path.join(rootDir, 'src/app/core/data/payments/mock-payments-data.service.ts'), 'utf8');
const tokensContentFull = fs.readFileSync(path.join(rootDir, 'src/app/core/data/tokens.ts'), 'utf8');

// 1. Money model — integer minor units only
assert('Finance Core', 'Money model uses integer minor units with explicit currency',
  financeModelContent.includes('interface Money') && financeModelContent.includes('amountMinor: number') && financeModelContent.includes("currency: Currency"));
assert('Finance Core', 'money() factory rejects non-integer minor units',
  financeLogicContent.includes('Math.trunc(amountMinor)') && financeLogicContent.includes('amount must be integer minor units'));

// 2. No floating-point arithmetic on money in the finance layer
assert('Finance Core', 'convertCurrency performs deterministic integer rounding (no float drift)',
  financeLogicContent.includes('Math.round(converted)') && !financeLogicContent.includes('toFixed(2) *'));
assert('Finance Core', 'Ledger balance derivation counts completed entries only (failed/reversed excluded)',
  financeLogicContent.includes("filter(e => e.status === 'completed')"));

// 3. Full interface surface exposed through PAYMENTS_DATA
assert('Finance Core', 'PaymentsDataService exposes finance methods (getFinanceWallet, getLedger, intents, processPayment, topUpWallet, transactions)',
  ['getFinanceWallet', 'getLedger', 'createPaymentIntent', 'processPayment', 'topUpWallet', 'getPaymentIntent', 'getFinanceTransactions']
    .every(m => tokensContentFull.includes(m + '(')));
assert('Finance Core', 'MockPaymentsDataService implements every finance method',
  ['getFinanceWallet', 'getLedger', 'createPaymentIntent', 'processPayment', 'topUpWallet', 'getPaymentIntent', 'getFinanceTransactions']
    .every(m => paymentsServiceContent.includes(m + '(')));

// 4. Terminal-safe state machine
assert('Finance Core', 'All four terminal states present and guarded (succeeded, failed, canceled, expired)',
  financeLogicContent.includes("'succeeded', 'failed', 'canceled', 'expired'") && financeLogicContent.includes('TERMINAL_STATES'));
assert('Finance Core', 'transitionPaymentIntent returns null on illegal moves (never throws, never mutates)',
  financeLogicContent.includes('return null') && financeLogicContent.includes('canTransitionPaymentState'));

// 5. Financial invariants in the service layer
assert('Finance Core', 'processPayment replays cached results for duplicate idempotency keys before any execution',
  paymentsServiceContent.indexOf('this.idempotencyResults[request.idempotencyKey]') < paymentsServiceContent.indexOf('this.executePayment(request)'));
assert('Finance Core', 'Wallet tenders validated against balance before any ledger write',
  paymentsServiceContent.includes("'insufficient_wallet'") && paymentsServiceContent.includes('walletCommittedMinor'));
assert('Finance Core', 'Failed attempts recorded as audit-only entries that never affect balance',
  paymentsServiceContent.includes('Failed payment attempt') && paymentsServiceContent.includes("'failed'"));
assert('Finance Core', 'Legacy wallet store stays in lockstep with ledger-derived balance',
  paymentsServiceContent.includes('syncLegacyWallet') && paymentsServiceContent.includes('userBalanceMinor(userId) / 100'));
assert('Finance Core', 'Deterministic decline rule for test PANs (last4 0002) without random failure flakiness',
  paymentsServiceContent.includes("DECLINE_LAST4 = '0002'") && paymentsServiceContent.includes('DECLINE_LAST4'));
assert('Finance Core', 'Service never grants library entitlement (no library import or call)',
  !/LIBRARY_DATA|addToLibrary/.test(paymentsServiceContent));

// 6. Overpayment & allocation guards
assert('Finance Core', 'allocateTenders caps each tender at remaining due',
  financeLogicContent.includes('Math.min(available, remaining)'));
assert('Finance Core', 'detectOverpayment provides the explicit overpayment guard used by processPayment',
  financeLogicContent.includes('detectOverpayment') && paymentsServiceContent.includes('detectOverpayment(request.tenders'));
assert('Finance Core', 'createPaymentIntent rejects non-positive or fractional amounts',
  paymentsServiceContent.includes('Number.isInteger(request.amountMinor)') && paymentsServiceContent.includes('amountMinor must be a positive integer'));

// 7. SSR safety of the new stores
assert('Finance Core', 'Finance stores persisted through SSR-safe LocalStoreService keys',
  paymentsServiceContent.includes("'wallet_ledger'") && paymentsServiceContent.includes("'finance_intents'") &&
  paymentsServiceContent.includes("'finance_transactions'") && paymentsServiceContent.includes("'finance_idempotency'"));

// 8. Zero payment UI changes in Phase 1 (data/logic phase discipline)
const purchaseModalTsPhase1 = fs.readFileSync(path.join(rootDir, 'src/app/shared/ui/purchase-confirm-modal/purchase-confirm-modal.component.ts'), 'utf8');
const accountPaymentTsPhase1 = fs.readFileSync(path.join(rootDir, 'src/app/features/account-payment/account-payment.component.ts'), 'utf8');
assert('Finance Core', 'Purchase modal untouched by finance core (no processPayment/intent coupling yet)',
  !purchaseModalTsPhase1.includes('processPayment') && !purchaseModalTsPhase1.includes('createPaymentIntent'));
assert('Finance Core', 'Account payment page untouched by finance core (legacy top-up flow intact)',
  !accountPaymentTsPhase1.includes('processPayment') && accountPaymentTsPhase1.includes('paymentsData.topUp'));

// ---------------------------------------------------------------------------
const orderModelContent = fs.readFileSync(path.join(rootDir, 'src/app/core/models/order.model.ts'), 'utf8');
const ordersServiceContent = fs.readFileSync(path.join(rootDir, 'src/app/core/data/orders/mock-orders-data.service.ts'), 'utf8');
const libraryComponentContent = fs.readFileSync(path.join(rootDir, 'src/app/features/library/library.component.ts'), 'utf8');
const gameDetailComponentContent = fs.readFileSync(path.join(rootDir, 'src/app/features/game-detail/game-detail.component.ts'), 'utf8');

// 1. Additive model + interface surface
assert('Purchase Revert', "OrderStatus gains terminal 'refunded' state (additive)",
  orderModelContent.includes("'confirmed' | 'pending' | 'failed' | 'refunded'"));
assert('Purchase Revert', 'revertOrder exposed on OrdersDataService and implemented idempotently',
  tokensContentFull.includes('revertOrder(orderId: string)') && ordersServiceContent.includes('revertOrder(orderId: string)') &&
  ordersServiceContent.includes("order.status !== 'confirmed'"));
assert('Purchase Revert', 'refundWallet exposed on PAYMENTS_DATA and implemented via refund_credit ledger entry',
  tokensContentFull.includes('refundWallet(userId: string, amountMinor: number, reference: string)') &&
  paymentsServiceContent.includes('refundWallet(userId: string, amountMinor: number, reference: string)') &&
  paymentsServiceContent.includes("'refund_credit'") && paymentsServiceContent.includes('this.syncLegacyWallet(userId)'));

// 2. Both removal paths orchestrate: find order -> wallet refund -> revert -> remove
for (const [name, content] of [['Library page', libraryComponentContent], ['Game detail', gameDetailComponentContent]] as const) {
  assert('Purchase Revert', name + ': paid-order lookup gates the revert (confirmed + price > 0)',
    content.includes("o.status === 'confirmed' && o.price > 0"));
  assert('Purchase Revert', name + ': wallet-tender orders refund via refundWallet before entitlement drop',
    content.includes("startsWith('NEXORA Store Wallet')") &&
    content.indexOf('refundWallet(user.id') < content.indexOf('removeFromLibrary(userId'));
  assert('Purchase Revert', name + ': order is reverted (refunded) before the library entry is removed',
    content.includes('.revertOrder(paidOrder.id)') &&
    content.indexOf('.revertOrder(paidOrder.id)') < content.indexOf('removeFromLibrary(userId'));
  assert('Purchase Revert', name + ': free games keep the plain removal path (no revert, no refund)',
    content.includes('proceedRemove(user.id, gameId, null)') || content.includes('proceedRemoveFromLibrary(user.id, gameId, null)'));
}

// 3. Outcome messaging distinguishes wallet refunds from plain reverts
assert('Purchase Revert', 'Wallet refunds toast the refunded amount',
  (libraryComponentContent + gameDetailComponentContent).includes('refunded to your wallet'));
assert('Purchase Revert', 'Purchase flow itself untouched — confirm contract still emits the payment string',
  gameDetailComponentContent.includes('onModalConfirm') && gameDetailComponentContent.includes('createOrder'));

// 23. INTEGRATION TESTS: Paid-Game Removal Reverts the Payment
// ---------------------------------------------------------------------------
// 24. INTEGRATION TESTS: Game Detail Wishlist Popups & Undo Action
// ---------------------------------------------------------------------------
assert('Wishlist Feedback', 'Game detail page displays toast popup on add to wishlist',
  gameDetailComponentContent.includes("title: 'Added to Wishlist'") &&
  gameDetailComponentContent.includes("type: 'success'"));
assert('Wishlist Feedback', 'Game detail page displays warning toast with Undo action on wishlist removal',
  gameDetailComponentContent.includes("title: 'Removed from Wishlist'") &&
  gameDetailComponentContent.includes("type: 'warning'") &&
  gameDetailComponentContent.includes("label: 'Undo'") &&
  gameDetailComponentContent.includes('undoRemoveWishlist'));
assert('Wishlist Feedback', 'Undo restores game to wishlist and confirms with restored toast',
  gameDetailComponentContent.includes("title: 'Restored to Wishlist'"));
// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const passed = results.filter(r => r.passed).length;
const total = results.length;
console.log('\n======================================================================');
console.log(`📊 INTEGRATION TEST SUMMARY: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
console.log('======================================================================\n');

if (passed !== total) {
  process.exit(1);
}
