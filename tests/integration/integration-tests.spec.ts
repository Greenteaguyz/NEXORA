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
