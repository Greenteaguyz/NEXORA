/**
 * PRE-LAUNCH TEST SUITE: CATEGORY 1A - UNIT TESTS
 * Standalone logic, form validation, calculations, and data transforms.
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

// 1. Email validation logic
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// 2. Password security rules
function isStrongPassword(password: string): boolean {
  return typeof password === 'string' && password.trim().length >= 6;
}

// 3. Price validation logic
function isValidGamePrice(price: number): boolean {
  return typeof price === 'number' && !isNaN(price) && price >= 0;
}

// 4. Creator Revenue Split Calculation (90% Creator / 10% Platform)
function calculateCreatorRevenue(price: number, sharePercent: number = 90): { creator: number; platform: number } {
  const creator = Number(((price * sharePercent) / 100).toFixed(2));
  const platform = Number((price - creator).toFixed(2));
  return { creator, platform };
}

// 5. System requirements formatting
function formatSystemRequirements(tier: 'minimum' | 'recommended', os: 'windows' | 'linux', ramGb: number): string {
  return `${tier.toUpperCase()} (${os.toUpperCase()}): ${ramGb} GB RAM`;
}

console.log('\n--- FUNCTIONAL UNIT TESTS ---');

// Assertions
assert('Validation', 'Standard email formats correctly pass', isValidEmail('developer@nexora.io'));
assert('Validation', 'Malformed emails fail validation', !isValidEmail('developer@nexora'));
assert('Validation', 'Password >= 6 characters passes', isStrongPassword('secret123'));
assert('Validation', 'Password < 6 characters rejected', !isStrongPassword('123'));
assert('Validation', 'Zero price is valid (Free to play)', isValidGamePrice(0));
assert('Validation', 'Positive price is valid ($4.99)', isValidGamePrice(4.99));
assert('Validation', 'Negative price is rejected', !isValidGamePrice(-1.00));

assert('Revenue Split', '90/10 split on $10.00 is $9.00 / $1.00', (() => {
  const s = calculateCreatorRevenue(10.00, 90);
  return s.creator === 9.00 && s.platform === 1.00;
})());

assert('Revenue Split', '90/10 split on $3.49 is $3.14 / $0.35', (() => {
  const s = calculateCreatorRevenue(3.49, 90);
  return s.creator === 3.14 && s.platform === 0.35;
})());

assert('Data Format', 'System specs string formats accurately', 
  formatSystemRequirements('minimum', 'windows', 8) === 'MINIMUM (WINDOWS): 8 GB RAM'
);

const passed = results.filter(r => r.passed).length;
const total = results.length;
console.log(`\n📊 UNIT TEST SUMMARY: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)\n`);

if (passed !== total) {
  process.exit(1);
}
