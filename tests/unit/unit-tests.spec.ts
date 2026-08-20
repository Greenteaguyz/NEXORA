/**
 * NEXORA AUTOMATED TEST SUITE: LAYER 1 - UNIT TESTS
 * Standalone logic, form validations, data transforms, and storage persistence.
 */

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

// ---------------------------------------------------------------------------
// 1. Form Validation Unit Tests
// ---------------------------------------------------------------------------
console.log('\n--- 1. UNIT TESTS: Form Validations & Constraints ---');

function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function isValidPassword(password: string): boolean {
  return typeof password === 'string' && password.trim().length >= 6;
}

function isValidGamePrice(price: number): boolean {
  return typeof price === 'number' && !isNaN(price) && price >= 0;
}

function validateGameForm(data: { title: string; price: number; coverUrl: string; tags: string[] }): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.title || data.title.trim().length === 0) errors.push('Title is required');
  if (data.title && data.title.trim().length > 100) errors.push('Title too long');
  if (!isValidGamePrice(data.price)) errors.push('Price must be a valid non-negative number');
  if (!data.coverUrl || !data.coverUrl.startsWith('http') && !data.coverUrl.startsWith('assets/')) errors.push('Valid cover URL required');
  if (!Array.isArray(data.tags) || data.tags.length === 0) errors.push('At least one tag required');
  return { valid: errors.length === 0, errors };
}

assert('Validation', 'Valid email passes check', isValidEmail('alice@nexora.io'));
assert('Validation', 'Invalid email without domain fails', !isValidEmail('alice@nexora'));
assert('Validation', 'Invalid email with missing @ fails', !isValidEmail('alicenexora.io'));
assert('Validation', 'Password >= 6 characters passes', isValidPassword('password123'));
assert('Validation', 'Short password fails', !isValidPassword('123'));
assert('Validation', 'Zero price is valid (Free game)', isValidGamePrice(0));
assert('Validation', 'Positive price is valid ($19.99)', isValidGamePrice(19.99));
assert('Validation', 'Negative price is rejected', !isValidGamePrice(-5.00));
assert('Validation', 'Complete game form validation succeeds', validateGameForm({
  title: 'Synth Blade Zero',
  price: 14.99,
  coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
  tags: ['Cyberpunk', 'Action']
}).valid);
assert('Validation', 'Empty title in game form fails validation', !validateGameForm({
  title: '',
  price: 14.99,
  coverUrl: 'assets/images/cover.jpg',
  tags: ['Action']
}).valid);

// ---------------------------------------------------------------------------
// 2. Data Transforms & Computations Unit Tests
// ---------------------------------------------------------------------------
console.log('\n--- 2. UNIT TESTS: Data Transforms & Computations ---');

function formatCurrency(price: number): string {
  return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
}

function calculateCreatorRevenue(price: number, sharePercent: number = 90): { creator: number; platform: number } {
  const creator = Number(((price * sharePercent) / 100).toFixed(2));
  const platform = Number((price - creator).toFixed(2));
  return { creator, platform };
}

function filterGamesByTag(games: Array<{ id: string; tags: string[] }>, tag: string): Array<{ id: string; tags: string[] }> {
  if (!tag || tag === 'all') return games;
  const lower = tag.toLowerCase();
  return games.filter(g => g.tags.some(t => t.toLowerCase() === lower));
}

assert('Transforms', 'Zero price formats as "Free"', formatCurrency(0) === 'Free');
assert('Transforms', 'Non-zero price formats as "$4.99"', formatCurrency(4.99) === '$4.99');
assert('Transforms', 'Creator 90/10 split on $10.00 is $9.00 / $1.00', (() => {
  const split = calculateCreatorRevenue(10.00, 90);
  return split.creator === 9.00 && split.platform === 1.00;
})());
assert('Transforms', 'Creator 90/10 split on $49.99 is $44.99 / $5.00', (() => {
  const split = calculateCreatorRevenue(49.99, 90);
  return split.creator === 44.99 && split.platform === 5.00;
})());

const sampleGames = [
  { id: '1', tags: ['Cyberpunk', 'Action'] },
  { id: '2', tags: ['RPG', 'Sci-Fi'] },
  { id: '3', tags: ['Cyberpunk', 'Strategy'] }
];
assert('Transforms', 'Tag filter "Cyberpunk" returns 2 games', filterGamesByTag(sampleGames, 'Cyberpunk').length === 2);
assert('Transforms', 'Tag filter "all" returns all 3 games', filterGamesByTag(sampleGames, 'all').length === 3);

// ---------------------------------------------------------------------------
// 3. Storage Persistence & Key Isolation Unit Tests
// ---------------------------------------------------------------------------
console.log('\n--- 3. UNIT TESTS: Storage Isolation & Namespace Prefixing ---');

class MockLocalStorage {
  private store: Map<string, string> = new Map();
  private prefix = 'nexora_';

  getItem<T>(key: string): T | null {
    const raw = this.store.get(this.prefix + key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    this.store.set(this.prefix + key, JSON.stringify(value));
  }

  removeItem(key: string): void {
    this.store.delete(this.prefix + key);
  }

  clearAll(): void {
    const keysToDelete: string[] = [];
    for (const k of this.store.keys()) {
      if (k.startsWith(this.prefix)) {
        keysToDelete.push(k);
      }
    }
    keysToDelete.forEach(k => this.store.delete(k));
  }

  get rawKeyCount(): number {
    return this.store.size;
  }
}

const storage = new MockLocalStorage();
storage.setItem('user_profile', { id: 'usr_alice', name: 'Alice' });
assert('Storage', 'Storage sets and gets JSON with prefix', storage.getItem<{ name: string }>('user_profile')?.name === 'Alice');
storage.removeItem('user_profile');
assert('Storage', 'Storage cleanly removes item', storage.getItem('user_profile') === null);

storage.setItem('key_1', 'val_1');
storage.setItem('key_2', 'val_2');
assert('Storage', 'Storage holds 2 prefixed keys', storage.rawKeyCount === 2);
storage.clearAll();
assert('Storage', 'clearAll() wipes all nexora_* keys', storage.rawKeyCount === 0);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const passed = results.filter(r => r.passed).length;
const total = results.length;
console.log('\n======================================================================');
console.log(`📊 UNIT TEST SUMMARY: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
console.log('======================================================================\n');

if (passed !== total) {
  process.exit(1);
}
