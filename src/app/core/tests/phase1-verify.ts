/**
 * Phase 1 Logic & Contract Automated Verification Test
 */
import { SEED_USERS, SEED_GAMES, SEED_LIBRARY_ENTRIES } from '../data/seed-data';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

console.log('--- RUNNING PHASE 1 AUTOMATED TESTS ---\n');

// Test 1: Seed Data Integrity
console.log('1. Checking Seed Data:');
assert(SEED_USERS.length === 3, 'Seed users count is 3 (Alice, Bob, Carol)');
assert(SEED_USERS.some(u => u.email === 'alice@nexora.io' && u.roles.includes('creator')), 'Alice is seeded as Creator');
assert(SEED_USERS.some(u => u.email === 'bob@nexora.io' && !u.roles.includes('creator')), 'Bob is seeded as Buyer-only');
assert(SEED_GAMES.length === 10, 'Seed games count is 10');
assert(SEED_GAMES.filter(g => g.price === 0).length === 6, '6 free games seeded');
assert(SEED_GAMES.filter(g => g.price > 0).length === 4, '4 paid games seeded');
assert(SEED_GAMES.every(g => g.samplePackageUrl.startsWith('assets/sample-packages/')), 'All games have valid downloadable package paths');

// Test 2: Role Filtering Logic
console.log('\n2. Checking Role Permission Logic:');
const alice = SEED_USERS.find(u => u.email === 'alice@nexora.io')!;
const bob = SEED_USERS.find(u => u.email === 'bob@nexora.io')!;

const isAliceCreator = alice.roles.includes('creator');
const isBobCreator = bob.roles.includes('creator');

assert(isAliceCreator === true, 'Alice has creator privileges');
assert(isBobCreator === false, 'Bob does NOT have creator privileges');

// Test 3: Game Ownership Rules
console.log('\n3. Checking Ownership Rules:');
const aliceGame = SEED_GAMES.find(g => g.id === 'game_001')!;
const carolGame = SEED_GAMES.find(g => g.id === 'game_003')!;

assert(aliceGame.ownerId === alice.id, 'Game 001 is owned by Alice');
assert(carolGame.ownerId !== alice.id, 'Game 003 is NOT owned by Alice');

// Test 4: Library Acquisition Rules
console.log('\n4. Checking Library Seed Data:');
assert(SEED_LIBRARY_ENTRIES.some(e => e.userId === bob.id && e.gameId === 'game_002'), 'Bob owns Cyber Heist (Free game)');
assert(!SEED_LIBRARY_ENTRIES.some(e => e.userId === bob.id && e.gameId === 'game_005'), 'Bob does not own Echoes of the Void');

console.log('\n🎉 ALL PHASE 1 AUTOMATED TESTS PASSED SUCCESSFULLY!');
