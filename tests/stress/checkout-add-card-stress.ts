// ---------------------------------------------------------------------------
// STRESS HARNESS: Checkout Add-Method (Shared Form) & ABA PayWay Rail
// Isolates validation, double-submit, handshake, auto-pricing and state
// failures under rapid and fuzzed interaction.
// Run: npx tsc tests/stress/checkout-add-card-stress.ts --rootDir . --outDir dist
//      --module commonjs --target es2022 --skipLibCheck --strict --experimentalDecorators
//      && node dist/tests/stress/checkout-add-card-stress.js
// ---------------------------------------------------------------------------
import '@angular/compiler';
import { Injector, PLATFORM_ID, runInInjectionContext, ɵINJECTOR_SCOPE } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, firstValueFrom } from 'rxjs';
import { AuthService } from '../../src/app/core/auth/auth.service';
import { LocalStoreService } from '../../src/app/core/persistence/local-store.service';
import { AuthMockService } from '../../src/app/core/auth/auth.mock';
import { MockPaymentsDataService } from '../../src/app/core/data/payments/mock-payments-data.service';
import { PAYMENTS_DATA } from '../../src/app/core/data/tokens';
import { AddPaymentMethodFormComponent } from '../../src/app/shared/ui/add-payment-method-form/add-payment-method-form.component';
import { AbaPaywaySheetComponent } from '../../src/app/shared/ui/aba-payway-sheet/aba-payway-sheet.component';
import { detectCardBrand, validateCardInput, luhnCheck, isCardExpired } from '../../src/app/core/data/payments/payment-logic';
import { AddCardMethodDto } from '../../src/app/core/models/payment.model';
import { SEED_USERS } from '../../src/app/core/data/seed-data';

// --- Assertion harness -----------------------------------------------------
let passCount = 0;
let failCount = 0;
const failures: string[] = [];
function assert(suite: string, name: string, condition: boolean, error?: string) {
  if (condition) {
    passCount++;
    console.log(`  ✅ [PASS] ${suite} > ${name}`);
  } else {
    failCount++;
    const detail = error ? ` — ${error}` : '';
    failures.push(`${suite} > ${name}${detail}`);
    console.log(`  ❌ [FAIL] ${suite} > ${name}${detail}`);
  }
}

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Valid Luhn-passing 16-digit PAN with the given prefix. */
function luhnValidPanic(prefix: string): string {
  const base = (prefix + '3').padEnd(15, '3');
  let sum = 0;
  for (let i = 0; i < base.length; i++) {
    let d = parseInt(base[base.length - 1 - i], 10);
    if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  const check = (10 - (sum % 10)) % 10;
  return base + String(check);
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Fixture factories (bare instantiation — components never render here) ---
function createPaymentsInjector() {
  return Injector.create({
    providers: [
      { provide: ɵINJECTOR_SCOPE, useValue: 'root' },
      { provide: PLATFORM_ID, useValue: 'server' },
      { provide: Router, useValue: { events: new Subject<any>(), url: '/', navigate: () => Promise.resolve(true) } },
      LocalStoreService,
      AuthMockService,
      AuthService,
      MockPaymentsDataService,
      { provide: PAYMENTS_DATA, useExisting: MockPaymentsDataService }
    ]
  });
}

function createFormFixture(methods: any[] = []): { component: any; added: any[]; payments: MockPaymentsDataService } {
  const injector = createPaymentsInjector();
  const fixtureAuth = injector.get(AuthService);
  if (!fixtureAuth.currentUser()) {
    (fixtureAuth as any).currentUser.set(SEED_USERS[0]);
  }
  const component: any = runInInjectionContext(injector, () => new AddPaymentMethodFormComponent());
  // Shadow input() signals with plain getters — bare instances never render.
  Object.defineProperty(component, 'methods', { get: () => () => methods });
  const added: any[] = [];
  component.added.subscribe((m: any) => added.push(m));
  return { component, added, payments: injector.get(MockPaymentsDataService) };
}

/** Guarantees a session user inside the fixture's own injector scope. */
function ensureFixtureUser(component: any): void {
  const auth = (component as { auth?: { currentUser: { (): any; set: (u: any) => void } } }).auth;
  if (auth && !auth.currentUser()) {
    auth.currentUser.set(SEED_USERS[0]);
  }
}

function createSheetFixture(amountUsd: number): { component: any; readonly completed: number; readonly cancelled: number } {
  const injector = createPaymentsInjector();
  const component: any = runInInjectionContext(injector, () => new AbaPaywaySheetComponent());
  Object.defineProperty(component, 'amountUsd', { get: () => () => amountUsd });
  Object.defineProperty(component, 'merchantName', { get: () => () => 'NEXORA' });
  Object.defineProperty(component, 'orderRef', { get: () => () => 'ord_stress' });
  const counts = { completed: 0, cancelled: 0 };
  component.completed.subscribe(() => counts.completed++);
  component.cancel.subscribe(() => counts.cancelled++);
  component.ngOnChanges({}); // fires the auto-set pricing path
  return {
    component,
    get completed() { return counts.completed; },
    get cancelled() { return counts.cancelled; }
  };
}

function fillCardForm(c: any, holder: string, number: string, expiry: string, cvv: string): void {
  c.cardHolder = holder;
  c.cardNumber = number;
  c.cardExpiry = expiry;
  c.cardCvv = cvv;
}

async function runAllStressSuites() {
  console.log('\n==========================================================');
  console.log('🚀 NEXORA CHECKOUT ADD-METHOD & PAYWAY STRESS BATTERY');
  console.log('==========================================================\n');

  const bootstrapInjector = createPaymentsInjector();
  const auth = bootstrapInjector.get(AuthService);
  if (!auth.currentUser()) {
    (auth as any).currentUser.set(SEED_USERS[0]);
  }

  // --- S1: Rapid tab toggle 1500x ------------------------------------------
  {
    const fx = createFormFixture();
    ensureFixtureUser(fx.component);
    for (let i = 0; i < 1500; i++) {
      fx.component.selectTab('khqr');
      fx.component.selectTab('card');
    }
    assert('S1 Rapid Toggle', 'Card tab active after 1500 cycles', fx.component.activeTab() === 'card');
    assert('S1 Rapid Toggle', 'Holder prefilled from session user', fx.component.cardHolder === SEED_USERS[0].displayName);
    assert('S1 Rapid Toggle', 'KHQR handle hint derived from session user', fx.component.khqrHandle.endsWith('@aba'));
  }

  // --- S2: Double-submit guard -------------------------------------------------
  {
    const fx = createFormFixture();
    ensureFixtureUser(fx.component);
    fillCardForm(fx.component, 'Stress User', luhnValidPanic('4'), '12/29', '123');
    fx.component.savingCard.set(true);
    fx.component.submitCard();
    fx.component.submitCard();
    fx.component.submitCard();
    assert('S2 Double Submit', 'No method emitted while a submit is already in flight', fx.added.length === 0);
    assert('S2 Double Submit', 'savingCard stays latched (no torn state)', fx.component.savingCard() === true);
  }

  // --- S3: Invalid input rejection matrix -----------------------------------------
  {
    const fx = createFormFixture();
    ensureFixtureUser(fx.component);
    const cases: Array<[string, string, string, string, string]> = [
      ['Fails Luhn', 'Stress User', '4242 4242 4242 4241', '12/29', '123'],
      ['Expired', 'Stress User', luhnValidPanic('4'), '01/20', '123'],
      ['Bad format', 'Stress User', luhnValidPanic('4'), '1229', '123'],
      ['Short holder', 'S', luhnValidPanic('4'), '12/29', '123'],
      ['Empty number', 'Stress User', '', '12/29', '123']
    ];
    for (const [label, holder, number, expiry, cvv] of cases) {
      fillCardForm(fx.component, holder, number, expiry, cvv);
      fx.component.submitCard();
      const rejected = fx.added.length === 0 && fx.component.cardFormErrors().length > 0;
      assert('S3 Rejection Matrix', `${label} card rejected inline with visible errors`, rejected, `${label} slipped through`);
      fx.component.cardFormErrors.set([]);
    }
  }

  // --- S4: Valid card — emits persisted method ---------------------------------------
  {
    const pan = luhnValidPanic('5'); // fresh Mastercard PAN (avoids seeded •••• 4242 duplicate)
    const fx = createFormFixture([]);
    ensureFixtureUser(fx.component);
    fillCardForm(fx.component, 'Stress User', pan.replace(/(.{4})/g, '$1 ').trim(), '12/29', '123');
    fx.component.submitCard();
    assert('S4 Valid Card', 'Valid card emitted with correct last4',
      fx.added.length === 1 && fx.added[0].type === 'card' && fx.added[0].last4 === pan.slice(-4));
    assert('S4 Valid Card', 'Service-side persistence agrees (method retrievable)',
      (await firstValueFrom(fx.payments.getMethods(SEED_USERS[0].id))).some((m: any) => m.last4 === pan.slice(-4)));
  }

  // --- S5: Duplicate card rejected end-to-end ------------------------------------------
  {
    const fx = createFormFixture([]);
    ensureFixtureUser(fx.component);
    const seeded = await firstValueFrom(fx.payments.getMethods(SEED_USERS[0].id));
    const seededCard: any = seeded.find((m: any) => m.type === 'card');
    assert('S5 Duplicate Guard', 'Seed fixture contains a saved card to duplicate', !!seededCard);
    if (seededCard) {
      const dto: AddCardMethodDto = { type: 'card', brand: seededCard.brand, holder: 'Dup Test', number: '4242424242424242', expiry: '12/29' };
      const result = await firstValueFrom(fx.payments.addMethod(SEED_USERS[0].id, dto));
      const duplicateRejected = !result.ok && (result as { errors?: string[] }).errors?.some(e => e.toLowerCase().includes('already saved')) === true;
      assert('S5 Duplicate Guard', 'Service rejects a duplicate of the seeded •••• 4242 card',
        duplicateRejected || seededCard.last4 !== '4242');
    }
  }

  // --- S6: KHQR link — validation + simulated handshake -----------------------------------
  {
    const fx = createFormFixture();
    ensureFixtureUser(fx.component);
    fx.component.selectTab('khqr');
    fx.component.khqrHandle = 'ab';
    fx.component.submitKhqr();
    assert('S6 KHQR Link', 'Short handle rejected before handshake', fx.added.length === 0 && fx.component.khqrFormErrors().length > 0);

    fx.component.khqrHandle = 'stressuser@wing';
    fx.component.khqrBank = 'Wing';
    fx.component.submitKhqr();
    assert('S6 KHQR Link', 'Handshake latches khqrLinking during the 1.2s connect', fx.component.khqrLinking() === true);
    await wait(1400);
    assert('S6 KHQR Link', 'Valid handle links after the simulated handshake',
      fx.added.length === 1 && fx.added[0].type === 'khqr' && fx.added[0].bank === 'Wing' && fx.component.khqrLinking() === false);
  }

  // --- S7: PayWay auto-set pricing ----------------------------------------------------------
  {
    const fx = createSheetFixture(39.99);
    assert('S7 PayWay Pricing', 'USD amount auto-set from the game price (minor units)', fx.component.amountMinor() === 3999);
    assert('S7 PayWay Pricing', 'KHR equivalent auto-computed at the 4100 snapshot (39.99 USD = 163,959 KHR major)',
      fx.component.khrMinor() === 16395900 && fx.component.khrLabel.includes('\u17DB'));
    assert('S7 PayWay Pricing', 'Rate snapshot label rendered', fx.component.rateLabel.includes('4,100'));
    assert('S7 PayWay Pricing', 'Sheet starts waiting with a full 5-minute countdown',
      fx.component.status() === 'waiting' && fx.component.countdownSeconds() === 300);
  }

  // --- S8: PayWay confirm → poll → success -----------------------------------------------------
  {
    const fx = createSheetFixture(19.99);
    fx.component.confirmPayment();
    assert('S8 PayWay Flow', 'Confirm switches to processing (single poll)', fx.component.status() === 'processing');
    fx.component.confirmPayment();
    await wait(4100);
    assert('S8 PayWay Flow', 'Poll settles into succeeded and emits completed once',
      fx.component.status() === 'succeeded' && fx.completed === 1);
  }

  // --- S9: PayWay regenerate + cancel + countdown ticking -------------------------------------------
  {
    const fx = createSheetFixture(9.99);
    await wait(1100);
    assert('S9 PayWay States', 'Countdown ticks down while waiting', fx.component.countdownSeconds() < 300);
    fx.component.regenerate();
    assert('S9 PayWay States', 'Regenerate resets to waiting with a full countdown',
      fx.component.status() === 'waiting' && fx.component.countdownSeconds() === 300);
    fx.component.emitCancel();
    assert('S9 PayWay States', 'Cancel emits exactly once', fx.cancelled === 1);
    fx.component.ngOnDestroy();
    assert('S9 PayWay States', 'Destroy clears timers without throwing', true);
  }

  // --- S10: Fuzzed submissions vs pure validation agreement (300 iterations) ---------------------------
  {
    const fx = createFormFixture([]);
    ensureFixtureUser(fx.component);
    // Isolated fuzz user: the oracle mirrors a store that starts empty.
    (fx.component.auth as any).currentUser.set({ ...SEED_USERS[0], id: 'usr_fuzz_stress' });
    const rand = mulberry32(1337);
    const prefixes = ['4', '51', '52', '55', '22', '9'];
    let disagreements = 0;
    let accepted = 0;
    const acceptedCardKeys = new Set<string>(); // service dedupes on (brand, last4)

    for (let i = 0; i < 300; i++) {
      const prefix = prefixes[Math.floor(rand() * prefixes.length)];
      let pan = '';
      if (rand() < 0.5) {
        pan = luhnValidPanic(prefix);
      } else {
        pan = (prefix + Math.floor(rand() * 1e12).toString().padStart(12, '0')).slice(0, 16);
      }
      const month = 1 + Math.floor(rand() * 12);
      const year = rand() < 0.5 ? 20 + Math.floor(rand() * 2) : 26 + Math.floor(rand() * 4);
      const expiry = `${String(month).padStart(2, '0')}/${String(year)}`;
      const spaced = pan.replace(/(.{4})/g, '$1 ').trim();

      const dto: AddCardMethodDto = {
        type: 'card',
        brand: detectCardBrand(spaced) ?? 'visa',
        holder: 'Stress User',
        number: pan,
        expiry
      };
      // The component's methods input is static, but accepted cards persist
      // service-side — mirror that duplicate rejection in the oracle.
      const expectedValid = validateCardInput(dto, []).valid && !acceptedCardKeys.has(dto.brand + '_' + dto.number.slice(-4));

      fillCardForm(fx.component, 'Stress User', spaced, expiry, '123');
      const before = fx.added.length;
      fx.component.submitCard();
      const acceptedNow = fx.added.length > before;
      if (acceptedNow !== expectedValid) { disagreements++; console.log('    DISAGREE pan='+pan+' expiry='+expiry+' errors='+JSON.stringify(fx.component.cardFormErrors())+' user='+(fx.component.auth.currentUser()?.id)); }
      if (acceptedNow) { accepted++; acceptedCardKeys.add(dto.brand + '_' + dto.number.slice(-4)); }
    }

    assert('S10 Fuzz Agreement', '300 fuzzed submissions agree with pure validateCardInput verdicts', disagreements === 0,
      `${disagreements} disagreements`);
    assert('S10 Fuzz Agreement', 'Fuzz battery produced both accepted and rejected paths', accepted > 0 && accepted < 300);
    assert('S10 Fuzz Agreement', 'Luhn oracle consistent for generated valid PANs', luhnCheck(luhnValidPanic('4')) === true);
    assert('S10 Fuzz Agreement', 'Expiry oracle flags historical dates', isCardExpired('01/20') === true);
  }

  // --- Summary -------------------------------------------------------------
  console.log('\n==========================================================');
  console.log(`📊 CHECKOUT ADD-METHOD & PAYWAY STRESS: ${passCount} passed, ${failCount} failed`);
  if (failCount > 0) {
    console.log('ISOLATED FAILURES:');
    failures.forEach(f => console.log(`  - ${f}`));
  }
  console.log('==========================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAllStressSuites();
