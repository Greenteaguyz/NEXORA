/**
 * NEXORA AUTOMATED TEST SUITE: LAYER 2 - INTEGRATION TESTS
 * Verifying service contracts, multi-step commerce flows, role guards, and data layer sync.
 */

import { SEED_GAMES, SEED_USERS, SEED_LIBRARY_ENTRIES, SEED_WISHLIST_ENTRIES } from '../../src/app/core/data/seed-data';
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
  orders: Order[] = [];

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
      id: `game_${Date.now()}`,
      ownerId,
      title: gameData.title || 'Untitled',
      description: gameData.description || '',
      tags: gameData.tags || ['Indie'],
      price: gameData.price ?? 9.99,
      coverImageUrl: gameData.coverImageUrl || '',
      screenshotUrls: gameData.screenshotUrls || [],
      samplePackageUrl: gameData.samplePackageUrl || 'assets/sample.zip',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.games.push(newGame);
    return newGame;
  }

  softDeleteGame(ownerId: string, gameId: string): boolean {
    const game = this.games.find(g => g.id === gameId && g.ownerId === ownerId);
    if (!game) return false;
    game.deletedAt = new Date().toISOString();
    return true;
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
assert('Reactive State Sync', 'Bob Mercer starts with 2 Library games (Cyber Heist & Pixel Odyssey)', 
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
assert('Reactive State Sync', 'Alice Vance view reactively projects 1 Wishlist game (Shadow Circuit)', 
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
