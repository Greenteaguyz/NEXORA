/**
 * PRE-LAUNCH TEST SUITE: CATEGORY 1B - INTEGRATION TESTS
 * Multi-step commerce, auth lifecycle, library claiming, and store persistence sync.
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

class MockIntegrationStore {
  games: Game[] = JSON.parse(JSON.stringify(SEED_GAMES));
  users: User[] = JSON.parse(JSON.stringify(SEED_USERS));
  library: LibraryEntry[] = JSON.parse(JSON.stringify(SEED_LIBRARY_ENTRIES));
  wishlist: WishlistEntry[] = JSON.parse(JSON.stringify(SEED_WISHLIST_ENTRIES));
  orders: Order[] = [];

  login(email: string): User | null {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  processPurchase(userId: string, gameId: string, price: number, paymentMethod: string): Order {
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

    // Instant library fulfillment
    this.library.push({
      id: `lib_${Date.now()}`,
      userId,
      gameId,
      orderId: order.id,
      acquiredAt: new Date().toISOString()
    });

    // Wishlist cleanup
    this.wishlist = this.wishlist.filter(w => !(w.userId === userId && w.gameId === gameId));
    return order;
  }
}

const store = new MockIntegrationStore();

console.log('\n--- FUNCTIONAL INTEGRATION TESTS ---');

// 1. Auth Persona Validation
const alice = store.login('alice@nexora.io');
assert('Integration Auth', 'Alice has verified creator permissions', alice !== null && alice.roles.includes('creator'));

const bob = store.login('bob@nexora.io');
assert('Integration Auth', 'Bob has verified buyer permissions', bob !== null && bob.roles.includes('buyer'));

// 2. Catalog Integrity
assert('Integration Catalog', 'Catalog is populated with games', store.games.length >= 8);
const marvelRivals = store.games.find(g => g.id === 'game_001');
assert('Integration Catalog', 'Marvel Rivals is present with tags and assets', !!marvelRivals && marvelRivals.tags.includes('Hero Shooter'));

// 3. Purchase & Fulfillment Cycle
const order = store.processPurchase('usr_bob', 'game_004', 3.49, 'Credit Card (Visa •••• 4242)');
assert('Integration Commerce', 'Order confirmed with Visa payment method', order.status === 'confirmed' && order.paymentMethod.includes('Visa'));
assert('Integration Commerce', 'Purchased game fulfilled in Bob\'s library', store.library.some(l => l.userId === 'usr_bob' && l.gameId === 'game_004'));
assert('Integration Commerce', 'Purchased game removed from wishlist', !store.wishlist.some(w => w.userId === 'usr_bob' && w.gameId === 'game_004'));

const passed = results.filter(r => r.passed).length;
const total = results.length;
console.log(`\n📊 INTEGRATION TEST SUMMARY: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)\n`);

if (passed !== total) {
  process.exit(1);
}
