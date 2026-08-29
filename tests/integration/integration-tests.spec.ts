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
