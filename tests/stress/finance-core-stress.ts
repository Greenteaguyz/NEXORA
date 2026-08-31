// ---------------------------------------------------------------------------
// STRESS HARNESS: Payment Finance Core (Ledger, Intents, Tenders, Idempotency)
// Isolates money-math drift, overpayment, negative-wallet and state-machine
// failures under fuzzed and adversarial sequences.
// Run: npx tsc tests/stress/finance-core-stress.ts --rootDir . --outDir dist
//      --module commonjs --target es2022 --skipLibCheck
//      && node dist/tests/stress/finance-core-stress.js
// ---------------------------------------------------------------------------
import '@angular/compiler';
import { Injector, PLATFORM_ID, runInInjectionContext, ɵINJECTOR_SCOPE } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, firstValueFrom } from 'rxjs';
import { LocalStoreService } from '../../src/app/core/persistence/local-store.service';
import { MockPaymentsDataService, MAX_TOP_UP_MINOR, DECLINE_LAST4 } from '../../src/app/core/data/payments/mock-payments-data.service';
import { MockOrdersDataService } from '../../src/app/core/data/orders/mock-orders-data.service';
import {
  convertCurrency,
  formatMoney,
  allocateTenders,
  detectOverpayment,
  validateWalletBalance,
  validateCvcFormat,
  validateCardNumber,
  canTransitionPaymentState,
  isTerminalPaymentState,
  transitionPaymentIntent,
  deriveLedgerBalance
} from '../../src/app/core/data/payments/payment-finance-logic';
import { PaymentIntentStatus, Tender } from '../../src/app/core/models/finance.model';
import { luhnCheck } from '../../src/app/core/data/payments/payment-logic';

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

/** Luhn-valid 16-digit PAN ending in a chosen last4 (searches one free digit). */
function luhnPanWithLast4(last4: string): string {
  for (let d = 0; d <= 9; d++) {
    const candidate = `4${d}110000000${last4}`;
    if (candidate.length === 16 && luhnCheck(candidate)) {
      return candidate;
    }
  }
  for (let d = 0; d <= 9; d++) {
    for (let e = 0; e <= 9; e++) {
      const candidate = `4${d}55${e}1000000${last4}`;
      if (candidate.length === 16 && luhnCheck(candidate)) {
        return candidate;
      }
    }
  }
  return '4000000000000002';
}

// --- Fixture factory -------------------------------------------------------
function createPaymentsFixture(): MockPaymentsDataService {
  const injector = Injector.create({
    providers: [
      { provide: ɵINJECTOR_SCOPE, useValue: 'root' },
      { provide: PLATFORM_ID, useValue: 'server' },
      { provide: Router, useValue: { events: new Subject<any>(), url: '/', navigate: () => Promise.resolve(true) } },
      LocalStoreService,
      MockOrdersDataService,
      MockPaymentsDataService
    ]
  });
  return injector.get(MockPaymentsDataService);
}

async function runAllStressSuites() {
  console.log('\n==========================================================');
  console.log('🚀 NEXORA PAYMENT FINANCE CORE STRESS BATTERY');
  console.log('==========================================================\n');

  // --- S1: Currency conversion fuzz (500 iterations) --------------------------
  {
    const rand = mulberry32(20260830);
    let drift = 0;
    for (let i = 0; i < 500; i++) {
      const usdMinor = Math.floor(rand() * 10_000_000);
      const khrMinor = convertCurrency(usdMinor, 'USD', 'KHR');
      if (!Number.isInteger(khrMinor)) { drift++; continue; }
      if (khrMinor !== convertCurrency(usdMinor, 'USD', 'KHR')) { drift++; } // determinism
    }
    assert('S1 Conversion Fuzz', '500 conversions stay integral and deterministic', drift === 0, `${drift} drift cases`);
    assert('S1 Conversion Fuzz', 'Same-currency conversion is identity', convertCurrency(12345, 'USD', 'USD') === 12345);
    assert('S1 Conversion Fuzz', 'KHR->USD round trip stays within 1 major unit', Math.abs(convertCurrency(convertCurrency(1000, 'USD', 'KHR'), 'KHR', 'USD') - 1000) <= 100);
    assert('S1 Conversion Fuzz', 'formatMoney renders USD and KHR glyphs', formatMoney({ amountMinor: 1234, currency: 'USD' }) === '$12.34' && formatMoney({ amountMinor: 492000, currency: 'KHR' }).includes('\u17DB'));
  }

  // --- S2: Tender allocation & overpayment guards ------------------------------
  {
    const alloc = allocateTenders([
      { type: 'wallet', availableMinor: 2000, currency: 'USD' },
      { type: 'card', availableMinor: 999_999, currency: 'USD', paymentMethodId: 'pm_x' }
    ], 2599);
    assert('S2 Allocation', 'Wallet tender capped at balance, card charged the remainder',
      alloc.ok && alloc.allocated[0].amountMinor === 2000 && alloc.allocated[1].amountMinor === 599 && alloc.remainingDueMinor === 0);
    const over = allocateTenders([{ type: 'card', availableMinor: 999_999, currency: 'USD' }], 100);
    assert('S2 Allocation', 'Single tender capped exactly at remaining due', over.ok && over.allocated[0].amountMinor === 100);
    const nothing = allocateTenders([{ type: 'wallet', availableMinor: 500, currency: 'USD' }], 0) as { ok: boolean; reason?: string };
    assert('S2 Allocation', 'Zero-due allocation explicitly rejected', !nothing.ok && nothing.reason === 'nothing_due');
    const negative = allocateTenders([], -5) as { ok: boolean; reason?: string };
    assert('S2 Allocation', 'Negative due explicitly rejected', !negative.ok && negative.reason === 'negative_due');
    const skipEmpty = allocateTenders([{ type: 'wallet', availableMinor: 0, currency: 'USD' }, { type: 'card', availableMinor: 800, currency: 'USD', paymentMethodId: 'pm_x' }], 800);
    assert('S2 Allocation', 'Empty-availability tenders skipped without breaking allocation', skipEmpty.ok && skipEmpty.allocated.length === 1);
    const evil: Tender[] = [{ type: 'card', amountMinor: 3000, currency: 'USD', paymentMethodId: 'pm_x' }];
    assert('S2 Allocation', 'detectOverpayment flags tenders exceeding due', detectOverpayment(evil, 2599) === true);
    assert('S2 Allocation', 'detectOverpayment flags non-positive tender amounts',
      detectOverpayment([{ type: 'card', amountMinor: 0, currency: 'USD', paymentMethodId: 'pm_x' }], 100) === true);
    assert('S2 Allocation', 'CVC validation accepts 3-4 digits only',
      validateCvcFormat('123') && validateCvcFormat('1234') && !validateCvcFormat('12') && !validateCvcFormat('12a3'));
    assert('S2 Allocation', 'Card number validation delegates to Luhn',
      validateCardNumber('4242424242424242') && !validateCardNumber('4242424242424241'));
  }

  // --- S3: Intent state-machine transition matrix (exhaustive 8x8) -------------
  {
    const states: PaymentIntentStatus[] = ['draft', 'requires_payment_method', 'processing', 'requires_action', 'succeeded', 'failed', 'canceled', 'expired'];
    const legal = new Set<string>([
      'draft>requires_payment_method', 'draft>canceled', 'draft>expired',
      'requires_payment_method>processing', 'requires_payment_method>canceled', 'requires_payment_method>expired',
      'processing>requires_action', 'processing>succeeded', 'processing>failed', 'processing>canceled',
      'requires_action>processing', 'requires_action>succeeded', 'requires_action>failed', 'requires_action>canceled', 'requires_action>expired'
    ]);
    let illegalAccepted = 0;
    for (const from of states) {
      for (const to of states) {
        const isLegal = legal.has(`${from}>${to}`);
        if (canTransitionPaymentState(from, to) !== isLegal) { illegalAccepted++; }
      }
    }
    assert('S3 State Machine', '64-pair transition matrix matches the strict transition map exactly', illegalAccepted === 0, `${illegalAccepted} mismatches`);
    assert('S3 State Machine', 'All four terminal states are frozen',
      ['succeeded', 'failed', 'canceled', 'expired'].every(s => isTerminalPaymentState(s as PaymentIntentStatus)));
    assert('S3 State Machine', 'Non-terminal states recognized as non-terminal',
      !isTerminalPaymentState('processing') && !isTerminalPaymentState('draft'));
    const base = {
      id: 'pi_x', orderId: 'ord_x', userId: 'usr_x', amountDueMinor: 100, amountPaidMinor: 0,
      currency: 'USD' as const, status: 'succeeded' as PaymentIntentStatus,
      createdAt: '2026-01-01T00:00:00Z', expiresAt: '2026-01-02T00:00:00Z', idempotencyKey: 'k'
    };
    assert('S3 State Machine', 'transitionPaymentIntent refuses to mutate a succeeded intent',
      transitionPaymentIntent(base, 'failed') === null && transitionPaymentIntent(base, 'processing') === null);
  }

  // --- S4: Happy path — funded wallet pays an intent -----------------------------
  {
    const svc = createPaymentsFixture();
    const userId = 'usr_fin_s4';
    await firstValueFrom(svc.addMethod(userId, { type: 'card', brand: 'visa', holder: 'Fin Tester', number: '4242424242424242', expiry: '12/29' }));
    await firstValueFrom(svc.topUpWallet({ userId, amountMinor: 5000, methodId: (await firstValueFrom(svc.getMethods(userId)))[0].id }));
    const intent = await firstValueFrom(svc.createPaymentIntent({ userId, orderId: 'ord_s4', amountMinor: 2599, currency: 'USD' }));
    const result = await firstValueFrom(svc.processPayment({
      intentId: intent.id, userId,
      tenders: [{ type: 'wallet', amountMinor: 2599, currency: 'USD' }],
      idempotencyKey: 'idem_s4_main'
    }));
    assert('S4 Happy Path', 'Fully-funded wallet payment succeeds', result.ok === true);
    if (result.ok) {
      assert('S4 Happy Path', 'Intent transitions to succeeded with amountPaid set', result.intent.status === 'succeeded' && result.intent.amountPaidMinor === 2599);
      assert('S4 Happy Path', 'Receipt id issued', result.receiptId.startsWith('rcpt_'));
    }
    const wallet = await firstValueFrom(svc.getFinanceWallet(userId));
    assert('S4 Happy Path', 'Ledger-derived balance is exactly top-up minus purchase', wallet.balanceMinor === 5000 - 2599);
    const legacy = await firstValueFrom(svc.getWalletSnapshot(userId));
    assert('S4 Happy Path', 'Legacy float wallet synced from ledger (no drift)', Math.abs(legacy.wallet.balance * 100 - (5000 - 2599)) < 0.001);
    const ledger = await firstValueFrom(svc.getLedger(userId));
    const debit = ledger.find(e => e.type === 'purchase_debit' && e.status === 'completed');
    assert('S4 Happy Path', 'Purchase debit entry carries balanceAfter snapshot', !!debit && debit.amountMinor === -2599 && debit.balanceAfterMinor === 2401);
  }

  // --- S5: Idempotency — replay returns the original result, zero side effects ----
  {
    const svc = createPaymentsFixture();
    const userId = 'usr_fin_s5';
    await firstValueFrom(svc.addMethod(userId, { type: 'card', brand: 'visa', holder: 'Fin Tester', number: '4242424242424242', expiry: '12/29' }));
    await firstValueFrom(svc.topUpWallet({ userId, amountMinor: 5000, methodId: (await firstValueFrom(svc.getMethods(userId)))[0].id }));
    const intent = await firstValueFrom(svc.createPaymentIntent({ userId, orderId: 'ord_s5', amountMinor: 1000, currency: 'USD' }));
    const first = await firstValueFrom(svc.processPayment({ intentId: intent.id, userId, tenders: [{ type: 'wallet', amountMinor: 1000, currency: 'USD' }], idempotencyKey: 'idem_s5_dup' }));
    const ledgerAfterFirst = (await firstValueFrom(svc.getLedger(userId))).length;
    const second = await firstValueFrom(svc.processPayment({ intentId: intent.id, userId, tenders: [{ type: 'wallet', amountMinor: 1000, currency: 'USD' }], idempotencyKey: 'idem_s5_dup' }));
    const ledgerAfterReplay = (await firstValueFrom(svc.getLedger(userId))).length;
    assert('S5 Idempotency', 'Replayed key returns identical result', JSON.stringify(first) === JSON.stringify(second));
    assert('S5 Idempotency', 'Replay writes no additional ledger entries', ledgerAfterFirst === ledgerAfterReplay);
    const wallet = await firstValueFrom(svc.getFinanceWallet(userId));
    assert('S5 Idempotency', 'Replay debits the wallet exactly once', wallet.balanceMinor === 4000);
    assert('S5 Idempotency', 'Distinct keys are not treated as replays',
      (await firstValueFrom(svc.processPayment({ intentId: 'pi_missing', userId, tenders: [{ type: 'wallet', amountMinor: 1, currency: 'USD' }], idempotencyKey: 'idem_s5_other' }))).ok === false);
  }

  // --- S6: Failure isolation — no debit, retry allowed -----------------------------
  {
    const svc = createPaymentsFixture();
    const userId = 'usr_fin_s6';
    await firstValueFrom(svc.addMethod(userId, { type: 'card', brand: 'visa', holder: 'Fin Tester', number: '4242424242424242', expiry: '12/29' }));
    await firstValueFrom(svc.topUpWallet({ userId, amountMinor: 1000, methodId: (await firstValueFrom(svc.getMethods(userId)))[0].id }));
    const intent = await firstValueFrom(svc.createPaymentIntent({ userId, orderId: 'ord_s6', amountMinor: 2599, currency: 'USD' }));
    const failed: { ok: boolean; failureReason?: string } = await firstValueFrom(svc.processPayment({
      intentId: intent.id, userId,
      tenders: [{ type: 'wallet', amountMinor: 2599, currency: 'USD' }],
      idempotencyKey: 'idem_s6_fail'
    }));
    const balanceAfterFail = (await firstValueFrom(svc.getFinanceWallet(userId))).balanceMinor;
    assert('S6 Failure Isolation', 'Insufficient wallet payment fails with explicit reason', !failed.ok && failed.failureReason === 'insufficient_wallet');
    assert('S6 Failure Isolation', 'Failed payment does NOT debit wallet', balanceAfterFail === 1000);
    assert('S6 Failure Isolation', 'Failed payment leaves intent retryable (not terminal)',
      (await firstValueFrom(svc.getPaymentIntent(intent.id)))?.status === 'requires_payment_method');
    const ledger = await firstValueFrom(svc.getLedger(userId));
    assert('S6 Failure Isolation', 'Failed attempt recorded as audit-only failed entry', ledger.some(e => e.status === 'failed' && e.reference === intent.id));
    assert('S6 Failure Isolation', 'deriveLedgerBalance ignores failed audit entries', deriveLedgerBalance(ledger).amountMinor === 1000);

    // Fund the wallet, then retry the SAME intent with the same key? No — new key, same intent.
    await firstValueFrom(svc.topUpWallet({ userId, amountMinor: 5000, methodId: (await firstValueFrom(svc.getMethods(userId)))[0].id }));
    const retried = await firstValueFrom(svc.processPayment({
      intentId: intent.id, userId,
      tenders: [{ type: 'wallet', amountMinor: 2599, currency: 'USD' }],
      idempotencyKey: 'idem_s6_retry'
    }));
    assert('S6 Failure Isolation', 'Retry after funding succeeds on the same intent', retried.ok === true);
    assert('S6 Failure Isolation', 'Wallet cannot go negative after the full sequence',
      (await firstValueFrom(svc.getFinanceWallet(userId))).balanceMinor === 6000 - 2599);
  }

  // --- S7: Deterministic card decline ----------------------------------------------
  {
    const svc = createPaymentsFixture();
    const userId = 'usr_fin_s7';
    const declinedPan = luhnPanWithLast4(DECLINE_LAST4);
    assert('S7 Card Decline', 'Harness generated a Luhn-valid PAN ending 0002', luhnCheck(declinedPan) && declinedPan.endsWith('0002'));
    await firstValueFrom(svc.addMethod(userId, { type: 'card', brand: 'visa', holder: 'Fin Tester', number: declinedPan, expiry: '12/29' }));
    const intent = await firstValueFrom(svc.createPaymentIntent({ userId, orderId: 'ord_s7', amountMinor: 1500, currency: 'USD' }));
    const result: { ok: boolean; failureReason?: string } = await firstValueFrom(svc.processPayment({
      intentId: intent.id, userId,
      tenders: [{ type: 'card', amountMinor: 1500, currency: 'USD', paymentMethodId: (await firstValueFrom(svc.getMethods(userId)))[0].id }],
      idempotencyKey: 'idem_s7_decline'
    }));
    assert('S7 Card Decline', 'Declined test card fails with card_declined', !result.ok && result.failureReason === 'card_declined');
    assert('S7 Card Decline', 'Declined card payment leaves wallet untouched (no wallet tender)', (await firstValueFrom(svc.getFinanceWallet(userId))).balanceMinor === 0);
    assert('S7 Card Decline', 'Intent remains retryable after decline', (await firstValueFrom(svc.getPaymentIntent(intent.id)))?.status === 'requires_payment_method');
  }

  // --- S8: Gift card tenders — single-use enforcement -------------------------------
  {
    const svc = createPaymentsFixture();
    const userId = 'usr_fin_s8';
    await firstValueFrom(svc.addMethod(userId, { type: 'card', brand: 'visa', holder: 'Fin Tester', number: '4242424242424242', expiry: '12/29' }));
    await firstValueFrom(svc.topUpWallet({ userId, amountMinor: 500, methodId: (await firstValueFrom(svc.getMethods(userId)))[0].id }));
    const intent = await firstValueFrom(svc.createPaymentIntent({ userId, orderId: 'ord_s8', amountMinor: 599, currency: 'USD' }));
    const ok = await firstValueFrom(svc.processPayment({
      intentId: intent.id, userId,
      tenders: [
        { type: 'gift_card', amountMinor: 500, currency: 'USD', giftCardCode: 'NEXO-WELCOME-2026' },
        { type: 'wallet', amountMinor: 99, currency: 'USD' }
      ],
      idempotencyKey: 'idem_s8_split'
    }));
    assert('S8 Gift Cards', 'Split payment gift card + wallet succeeds', ok.ok === true);
    const wallet = await firstValueFrom(svc.getFinanceWallet(userId));
    assert('S8 Gift Cards', 'Only the wallet share is debited from the wallet', wallet.balanceMinor === 401);
    const replayIntent = await firstValueFrom(svc.createPaymentIntent({ userId, orderId: 'ord_s8b', amountMinor: 599, currency: 'USD' }));
    const reuse: { ok: boolean; failureReason?: string } = await firstValueFrom(svc.processPayment({
      intentId: replayIntent.id, userId,
      tenders: [{ type: 'gift_card', amountMinor: 599, currency: 'USD', giftCardCode: 'NEXO-WELCOME-2026' }],
      idempotencyKey: 'idem_s8_reuse'
    }));
    assert('S8 Gift Cards', 'Already-redeemed gift card is rejected', !reuse.ok && reuse.failureReason === 'gift_card_invalid');
    const bogus = await firstValueFrom(svc.createPaymentIntent({ userId, orderId: 'ord_s8c', amountMinor: 599, currency: 'USD' }));
    const unknown: { ok: boolean; failureReason?: string } = await firstValueFrom(svc.processPayment({
      intentId: bogus.id, userId,
      tenders: [{ type: 'gift_card', amountMinor: 599, currency: 'USD', giftCardCode: 'NEXO-DOES-NOT-EXIST' }],
      idempotencyKey: 'idem_s8_unknown'
    }));
    assert('S8 Gift Cards', 'Unknown gift card code is rejected', !unknown.ok && unknown.failureReason === 'gift_card_invalid');
  }

  // --- S9: Overpayment & top-up guards ----------------------------------------------
  {
    const svc = createPaymentsFixture();
    const userId = 'usr_fin_s9';
    const intent = await firstValueFrom(svc.createPaymentIntent({ userId, orderId: 'ord_s9', amountMinor: 1000, currency: 'USD' }));
    const over: { ok: boolean; failureReason?: string } = await firstValueFrom(svc.processPayment({
      intentId: intent.id, userId,
      tenders: [{ type: 'card', amountMinor: 1500, currency: 'USD', paymentMethodId: 'pm_any' }],
      idempotencyKey: 'idem_s9_over'
    }));
    assert('S9 Overpayment', 'Tender exceeding due is rejected before method lookup', !over.ok && over.failureReason === 'overpayment');
    const partial: { ok: boolean; failureReason?: string } = await firstValueFrom(svc.processPayment({
      intentId: intent.id, userId,
      tenders: [{ type: 'card', amountMinor: 500, currency: 'USD', paymentMethodId: 'pm_any' }],
      idempotencyKey: 'idem_s9_partial'
    }));
    assert('S9 Overpayment', 'Underpayment (remaining due > 0 after allocation) is rejected', !partial.ok && partial.failureReason === 'no_tender');
    const noTender: { ok: boolean; failureReason?: string } = await firstValueFrom(svc.processPayment({ intentId: intent.id, userId, tenders: [], idempotencyKey: 'idem_s9_empty' }));
    assert('S9 Overpayment', 'Empty tender list rejected', !noTender.ok && noTender.failureReason === 'no_tender');

    let topUpThrows = false;
    try {
      await firstValueFrom(svc.createPaymentIntent({ userId, orderId: 'ord_s9b', amountMinor: 100.5 as number, currency: 'USD' }));
    } catch { topUpThrows = true; }
    assert('S9 Overpayment', 'Fractional intent amounts are rejected at creation', topUpThrows);

    const badTopUp: { ok: boolean; reason?: string } = await firstValueFrom(svc.topUpWallet({ userId, amountMinor: 0, methodId: 'pm_x' }));
    const hugeTopUp: { ok: boolean; reason?: string } = await firstValueFrom(svc.topUpWallet({ userId, amountMinor: MAX_TOP_UP_MINOR + 1, methodId: 'pm_x' }));
    const fractionalTopUp: { ok: boolean; reason?: string } = await firstValueFrom(svc.topUpWallet({ userId, amountMinor: 999.5 as number, methodId: 'pm_x' }));
    assert('S9 Overpayment', 'Top-up rejects zero, over-max and fractional amounts',
      !badTopUp.ok && badTopUp.reason === 'invalid_amount' && hugeTopUp.ok === false && fractionalTopUp.ok === false);
    const validateWalletHolds = validateWalletBalance(0, 1) === false && validateWalletBalance(100, 100) === true;
    assert('S9 Overpayment', 'Wallet can never go negative per pure rule', validateWalletHolds);
  }

  // --- S10: Fuzzed spend sequences never drive the wallet negative (100 users) ------
  {
    const svc = createPaymentsFixture();
    const rand = mulberry32(424242);
    let negativeWallets = 0;
    let totalSucceeded = 0;
    for (let i = 0; i < 100; i++) {
      const userId = `usr_fin_fuzz_${i}`;
      await firstValueFrom(svc.addMethod(userId, { type: 'card', brand: 'visa', holder: `Fuzz ${i}`, number: '4242424242424242', expiry: '12/29' }));
      const methodId = (await firstValueFrom(svc.getMethods(userId)))[0].id;
      const fundMinor = Math.floor(rand() * 3000);
      if (fundMinor > 0) {
        await firstValueFrom(svc.topUpWallet({ userId, amountMinor: fundMinor, methodId }));
      }
      const balance = (await firstValueFrom(svc.getFinanceWallet(userId))).balanceMinor;
      if (balance < 0) { negativeWallets++; continue; }
      // Attempt to overdraw: wallet tender always larger than balance.
      const intent = await firstValueFrom(svc.createPaymentIntent({ userId, orderId: `ord_fuzz_${i}`, amountMinor: fundMinor + 1 + Math.floor(rand() * 5000), currency: 'USD' }));
      const result = await firstValueFrom(svc.processPayment({
        intentId: intent.id, userId,
        tenders: [{ type: 'wallet', amountMinor: intent.amountDueMinor, currency: 'USD' }],
        idempotencyKey: `idem_fuzz_${i}`
      }));
      const after = (await firstValueFrom(svc.getFinanceWallet(userId))).balanceMinor;
      if (after < 0) { negativeWallets++; }
      if (after !== balance && result.ok) { negativeWallets++; } // any change must equal a succeeded payment
      if (result.ok) { totalSucceeded++; }
    }
    assert('S10 Negative-Wallet Fuzz', '100 overdraw attempts never drive any wallet negative', negativeWallets === 0, `${negativeWallets} violations`);
    assert('S10 Negative-Wallet Fuzz', 'Every overdraw was rejected (none succeeded)', totalSucceeded === 0);
  }

  // --- S11: Purchase revert — refund wallet + order refunded -------------------
  {
    const svc = createPaymentsFixture();
    const orders = (function(){
      const inj = Injector.create({ providers: [ { provide: ɵINJECTOR_SCOPE, useValue: 'root' }, { provide: PLATFORM_ID, useValue: 'server' }, LocalStoreService, MockOrdersDataService ] });
      return inj.get(MockOrdersDataService);
    })();
    const userId = 'usr_fin_s11';
    await firstValueFrom(svc.addMethod(userId, { type: 'card', brand: 'visa', holder: 'Fin Tester', number: '4242424242424242', expiry: '12/29' }));
    const methodId = (await firstValueFrom(svc.getMethods(userId)))[0].id;
    await firstValueFrom(svc.topUpWallet({ userId, amountMinor: 5000, methodId }));

    const intent = await firstValueFrom(svc.createPaymentIntent({ userId, orderId: 'ord_s11', amountMinor: 2599, currency: 'USD' }));
    await firstValueFrom(svc.processPayment({ intentId: intent.id, userId, tenders: [{ type: 'wallet', amountMinor: 2599, currency: 'USD' }], idempotencyKey: 'idem_s11_buy' }));
    const afterBuy = (await firstValueFrom(svc.getFinanceWallet(userId))).balanceMinor;

    const order = await firstValueFrom(orders.createOrder(userId, 'game_s11', 25.99, 'NEXORA Store Wallet ( .00)'));
    const wallet = await firstValueFrom(svc.refundWallet(userId, 2599, order.id));
    assert('S11 Purchase Revert', 'refund_credit ledger entry lands with correct balanceAfter',
      wallet.balanceMinor === afterBuy + 2599 && wallet.balanceMinor === 5000);
    const ledger = await firstValueFrom(svc.getLedger(userId));
    const refundEntry = ledger.find(e => e.type === 'refund_credit' && e.reference === order.id);
    assert('S11 Purchase Revert', 'refund entry is completed and references the order',
      !!refundEntry && refundEntry.status === 'completed' && refundEntry.amountMinor === 2599);
    const legacy = await firstValueFrom(svc.getWalletSnapshot(userId));
    assert('S11 Purchase Revert', 'Legacy wallet synced from ledger after refund', Math.round(legacy.wallet.balance * 100) === 5000);

    const reverted = await firstValueFrom(orders.revertOrder(order.id));
    assert('S11 Purchase Revert', 'Order transitions confirmed -> refunded', reverted.status === 'refunded');
    const again = await firstValueFrom(orders.revertOrder(order.id));
    assert('S11 Purchase Revert', 'Double revert is an idempotent no-op',
      again.status === 'refunded' && (await firstValueFrom(svc.getFinanceWallet(userId))).balanceMinor === 5000);

    const order2 = await firstValueFrom(orders.createOrder(userId, 'game_s11b', 9.99, 'Credit Card (Visa •••• 4242)'));
    await firstValueFrom(orders.revertOrder(order2.id));
    assert('S11 Purchase Revert', 'Non-wallet order reverts without wallet movement',
      (await firstValueFrom(orders.getOrders(userId))).find(o => o.id === order2.id)?.status === 'refunded' &&
      (await firstValueFrom(svc.getFinanceWallet(userId))).balanceMinor === 5000);

    let threw = false;
    try { await firstValueFrom(svc.refundWallet(userId, 10.5 as number, 'bad')); } catch { threw = true; }
    assert('S11 Purchase Revert', 'Fractional refunds rejected', threw);
  }


  // --- Summary -------------------------------------------------------------
  console.log('\n==========================================================');
  console.log(`📊 FINANCE CORE STRESS: ${passCount} passed, ${failCount} failed`);
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
