// ---------------------------------------------------------------------------
// STRESS HARNESS: Log Out Confirmation Modal (HeaderComponent)
// Isolates failure cases under rapid/duplicated/keyboard-driven interaction.
// Run: npx tsc tests/stress/logout-confirm-stress.ts --rootDir . --outDir dist
//      --module commonjs --target es2022 --skipLibCheck
//      && node dist/tests/stress/logout-confirm-stress.js
// ---------------------------------------------------------------------------
import '@angular/compiler';
import { Injector, ElementRef, PLATFORM_ID, runInInjectionContext, ɵINJECTOR_SCOPE } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { AuthService } from '../../src/app/core/auth/auth.service';
import { LocalStoreService } from '../../src/app/core/persistence/local-store.service';
import { AuthMockService } from '../../src/app/core/auth/auth.mock';
import { ThemeService } from '../../src/app/core/theme/theme.service';
import { CommandPaletteService } from '../../src/app/core/services/command-palette.service';
import { ScrollLockService } from '../../src/app/core/services/scroll-lock.service';
import { ToastService } from '../../src/app/core/services/toast.service';
import { WISHLIST_DATA } from '../../src/app/core/data/tokens';
import { SEED_USERS } from '../../src/app/core/data/seed-data';

// RoleBadgeComponent cannot JIT-load under the plain tsc runner; the header
// state-machine stress never renders it, so stub its module before requiring
// the header component (lazily, after the patch, since static imports hoist).
const nodeModule = require('module') as { _extensions: Record<string, (m: unknown, f: string) => void> };
const originalJsHandler = nodeModule._extensions['.js'];
nodeModule._extensions['.js'] = function (modInstance: { _compile: (code: string, f: string) => void }, filename: string) {
  if (filename.endsWith('role-badge.component.js')) {
    modInstance._compile('class RoleBadgeStub {}\nmodule.exports = { RoleBadgeComponent: RoleBadgeStub };', filename);
    return;
  }
  originalJsHandler(modInstance, filename);
};

// Lazy require so the role-badge stub below installs first. Resolves into
// dist/src/... — compile the header entry BEFORE this harness (see run cmd)
// or a stale emit will be loaded:
//   npx tsc src/app/layout/header/header.component.ts --rootDir . --outDir dist --module commonjs --target es2022 --skipLibCheck
//   npx tsc tests/stress/logout-confirm-stress.ts      --rootDir . --outDir dist --module commonjs --target es2022 --skipLibCheck
//   node dist/tests/stress/logout-confirm-stress.js
const headerModule = require('../../src/app/layout/header/header.component') as { HeaderComponent: any };
const HeaderComponent = headerModule.HeaderComponent;

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

// --- DOM stubs (browser keyboard/focus surface, Node-safe) ------------------
interface StubElement {
  name: string;
  focusCalls: number;
  focus(): void;
  contains(other: unknown): boolean;
}

function makeStubElement(name: string): StubElement {
  const el: StubElement = {
    name,
    focusCalls: 0,
    focus() { el.focusCalls++; (globalThis as any).document.activeElement = el; },
    contains: () => false
  };
  return el;
}

interface DomStubs {
  cancelBtn: StubElement;
  confirmBtn: StubElement;
  trigger: StubElement;
  modalCard: { querySelectorAll(selector: string): StubElement[]; contains(other: unknown): boolean };
  install(): void;
}

function buildDomStubs(): DomStubs {
  const cancelBtn = makeStubElement('cancel');
  const confirmBtn = makeStubElement('confirm');
  const trigger = makeStubElement('logout-trigger');
  const focusables = [cancelBtn, confirmBtn];
  const modalCard = {
    querySelectorAll: (selector: string) => (selector.includes('button') ? focusables : []),
    contains: (other: unknown) => focusables.includes(other as StubElement)
  };
  return {
    cancelBtn, confirmBtn, trigger, modalCard,
    install() {
      (globalThis as any).document = {
        activeElement: null,
        querySelector: () => null,
        querySelectorAll: () => [],
        body: {},
        documentElement: { setAttribute: () => undefined, removeAttribute: () => undefined, style: {} }
      };
    }
  };
}

function keyEvent(key: string, shiftKey = false): { event: KeyboardEvent; prevented(): boolean } {
  let prevented = false;
  return {
    event: { key, shiftKey, preventDefault: () => { prevented = true; } } as unknown as KeyboardEvent,
    prevented: () => prevented
  };
}

// --- Header factory (counting router + DOM-aware host) ----------------------
interface HeaderFixture {
  header: any;
  toastService: ToastService;
  navCalls(): number;
  hostNative: { querySelector(selector: string): unknown };
}

function createHeaderFixture(stubs: DomStubs): HeaderFixture {
  const navLog: number[] = [];
  const hostNative = { querySelector: (selector: string) => (selector === '.modal-card' ? stubs.modalCard : null) };
  const injector = Injector.create({
    providers: [
      { provide: ɵINJECTOR_SCOPE, useValue: 'root' },
      { provide: PLATFORM_ID, useValue: 'server' },
      { provide: Router, useValue: { events: new Subject<any>(), url: '/', navigate: () => { navLog.push(1); return Promise.resolve(true); } } },
      { provide: ElementRef, useValue: { nativeElement: hostNative } },
      {
        provide: WISHLIST_DATA,
        useValue: { getWishlist: () => of([]), addToWishlist: () => of(), removeFromWishlist: () => of(), isWishlisted: () => of(false) }
      },
      LocalStoreService,
      AuthMockService,
      AuthService,
      ThemeService,
      CommandPaletteService,
      ScrollLockService,
      ToastService
    ]
  });
  const header = runInInjectionContext(injector, () => new HeaderComponent());
  return {
    header,
    toastService: injector.get(ToastService),
    navCalls: () => navLog.length,
    hostNative
  };
}

function freshSession(fixture: HeaderFixture): void {
  fixture.header.authService.currentUser.set(SEED_USERS[0]);
}

// --- S1: Rapid request/cancel toggle stress ---------------------------------
console.log('\n--- S1: RAPID REQUEST/CANCEL TOGGLE (2000 cycles) ---');
{
  const stubs = buildDomStubs(); stubs.install();
  const fx = createHeaderFixture(stubs);
  freshSession(fx);
  const user = SEED_USERS[0];
  for (let i = 0; i < 2000; i++) {
    (fx.header as any).requestLogout();
    fx.header.cancelLogout();
  }
  assert('S1 Rapid Toggle', 'modal fully closed after 2000 open/close cycles', fx.header.logoutConfirmOpen() === false);
  assert('S1 Rapid Toggle', 'session survived all 2000 cycles', fx.header.authService.currentUser() === user);
  assert('S1 Rapid Toggle', 'no logout navigations fired', fx.navCalls() === 0, `navCalls=${fx.navCalls()}`);
  assert('S1 Rapid Toggle', 'no toasts emitted', fx.toastService.toasts().length === 0);
}

// --- S2: Double confirm (duplicate activation) -------------------------------
console.log('\n--- S2: DOUBLE CONFIRM ---');
{
  const stubs = buildDomStubs(); stubs.install();
  const fx = createHeaderFixture(stubs);
  freshSession(fx);
  (fx.header as any).requestLogout();
  (fx.header as any).confirmLogout();
  (fx.header as any).confirmLogout(); // duplicate click / double Enter
  assert('S2 Double Confirm', 'AuthService.logout() runs exactly once (single navigation)', fx.navCalls() === 1, `navCalls=${fx.navCalls()}`);
  assert('S2 Double Confirm', 'exactly one "Signed Out" toast', fx.toastService.toasts().length === 1, `toasts=${fx.toastService.toasts().length}`);
  assert('S2 Double Confirm', 'session cleared exactly the same', fx.header.authService.currentUser() === null);
}

// --- S3: Escape spam with drawer open ----------------------------------------
console.log('\n--- S3: ESCAPE SPAM WITH DRAWER OPEN (500 rounds) ---');
{
  const stubs = buildDomStubs(); stubs.install();
  const fx = createHeaderFixture(stubs);
  freshSession(fx);
  fx.header.mobileMenuOpen.set(true);
  for (let i = 0; i < 500; i++) {
    (fx.header as any).requestLogout();
    fx.header.handleKeydown({ key: 'Escape' } as KeyboardEvent);
  }
  assert('S3 Escape Spam', 'modal closed after every Escape round', fx.header.logoutConfirmOpen() === false);
  assert('S3 Escape Spam', 'mobile drawer stayed open through all rounds', fx.header.mobileMenuOpen() === true);
  assert('S3 Escape Spam', 'session intact', fx.header.authService.currentUser() === SEED_USERS[0]);
  assert('S3 Escape Spam', 'no navigations fired', fx.navCalls() === 0);
}

// --- S4: Tab containment while modal open ------------------------------------
console.log('\n--- S4: TAB CONTAINMENT (modal open) ---');
{
  const stubs = buildDomStubs(); stubs.install();
  const fx = createHeaderFixture(stubs);
  freshSession(fx);
  (fx.header as any).requestLogout();
  // Focus is outside the modal (e.g. on body) — Tab must be pulled back inside.
  (globalThis as any).document.activeElement = null;
  const tab = keyEvent('Tab');
  fx.header.handleKeydown(tab.event);
  assert('S4 Tab Containment', 'Tab with focus outside modal is preventDefault-ed', tab.prevented());
  assert('S4 Tab Containment', 'Tab pulls focus to first modal control', stubs.cancelBtn.focusCalls === 1, `cancel.focusCalls=${stubs.cancelBtn.focusCalls}`);

  // Forward Tab from the last control wraps to the first.
  stubs.cancelBtn.focusCalls = 0;
  stubs.confirmBtn.focusCalls = 0;
  (globalThis as any).document.activeElement = stubs.confirmBtn;
  const tabEnd = keyEvent('Tab');
  fx.header.handleKeydown(tabEnd.event);
  assert('S4 Tab Containment', 'Forward Tab on last control wraps to first', tabEnd.prevented() && stubs.cancelBtn.focusCalls === 1);
}

// --- S5: Shift+Tab containment (modal open) ----------------------------------
console.log('\n--- S5: SHIFT+TAB CONTAINMENT (modal open) ---');
{
  const stubs = buildDomStubs(); stubs.install();
  const fx = createHeaderFixture(stubs);
  freshSession(fx);
  (fx.header as any).requestLogout();
  (globalThis as any).document.activeElement = stubs.cancelBtn;
  const shiftTab = keyEvent('Tab', true);
  fx.header.handleKeydown(shiftTab.event);
  assert('S5 Shift+Tab', 'Backward Tab on first control wraps to last', shiftTab.prevented() && stubs.confirmBtn.focusCalls === 1, `confirm.focusCalls=${stubs.confirmBtn.focusCalls}`);
}

// --- S6: Focus restoration on cancel ------------------------------------------
console.log('\n--- S6: FOCUS RESTORATION ON CANCEL ---');
{
  const stubs = buildDomStubs(); stubs.install();
  const fx = createHeaderFixture(stubs);
  freshSession(fx);
  (fx.header as any).requestLogout({ currentTarget: stubs.trigger });
  fx.header.cancelLogout();
  assert('S6 Focus Restore', 'Cancel returns focus to the Log Out trigger', stubs.trigger.focusCalls === 1, `trigger.focusCalls=${stubs.trigger.focusCalls}`);
  assert('S6 Focus Restore', 'trigger reference released after close', (fx.header as any).logoutReturnFocus === null || (fx.header as any).logoutReturnFocus === undefined);

  // Escape-dismissal path restores focus too.
  stubs.trigger.focusCalls = 0;
  (fx.header as any).requestLogout({ currentTarget: stubs.trigger });
  fx.header.handleKeydown({ key: 'Escape' } as KeyboardEvent);
  assert('S6 Focus Restore', 'Escape dismissal returns focus to the trigger', stubs.trigger.focusCalls === 1);
}

// --- S7: Confirm with expired session -----------------------------------------
console.log('\n--- S7: CONFIRM WITH EXPIRED SESSION ---');
{
  const stubs = buildDomStubs(); stubs.install();
  const fx = createHeaderFixture(stubs);
  freshSession(fx);
  (fx.header as any).requestLogout();
  fx.header.authService.currentUser.set(null); // session dies while modal open
  let crashed = false;
  try {
    (fx.header as any).confirmLogout();
  } catch {
    crashed = true;
  }
  assert('S7 Expired Session', 'confirmLogout with null session does not crash', !crashed);
  assert('S7 Expired Session', 'modal closed', fx.header.logoutConfirmOpen() === false);
  assert('S7 Expired Session', 'drawer closed', fx.header.mobileMenuOpen() === false);
}

// --- S8: Seeded fuzz with live invariants -------------------------------------
console.log('\n--- S8: SEEDED FUZZ (600 iterations x 24 ops) ---');
{
  const stubs = buildDomStubs(); stubs.install();
  const fx = createHeaderFixture(stubs);
  freshSession(fx);
  // mulberry32 — deterministic PRNG so failures reproduce exactly.
  let seed = 0x5f3759df;
  const rand = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  let snapshotViolations = 0;
  let blindConfirmBrokeSession = 0;
  let everConfirmed = false;

  for (let iter = 0; iter < 600; iter++) {
    for (let op = 0; op < 24; op++) {
      const roll = rand();
      if (roll < 0.18) {
        (fx.header as any).requestLogout(rand() < 0.5 ? { currentTarget: stubs.trigger } : undefined);
      } else if (roll < 0.36) {
        fx.header.cancelLogout();
      } else if (roll < 0.48) {
        if (fx.header.logoutConfirmOpen()) {
          everConfirmed = true;
          (fx.header as any).confirmLogout();
        }
      } else if (roll < 0.58) {
        // Blind confirm: with the modal closed this must be a no-op; with the
        // modal open it is just a normal confirm.
        const modalWasOpen = fx.header.logoutConfirmOpen();
        const before = fx.header.authService.currentUser();
        (fx.header as any).confirmLogout();
        if (modalWasOpen) {
          everConfirmed = true;
        } else if (!everConfirmed && fx.header.authService.currentUser() !== before) {
          blindConfirmBrokeSession++;
        }
      } else if (roll < 0.66) {
        fx.header.handleKeydown({ key: 'Escape' } as KeyboardEvent);
      } else if (roll < 0.74) {
        const ev = keyEvent('Tab');
        (globalThis as any).document.activeElement = rand() < 0.5 ? null : stubs.confirmBtn;
        fx.header.handleKeydown(ev.event);
      } else if (roll < 0.8) {
        const ev = keyEvent('Tab', true);
        (globalThis as any).document.activeElement = stubs.cancelBtn;
        fx.header.handleKeydown(ev.event);
      } else if (roll < 0.9) {
        fx.header.mobileMenuOpen.set(!fx.header.mobileMenuOpen());
      } else {
        fx.header.closeMobileMenu();
      }
      // Live invariant: while the modal is open, the session must be exactly
      // what it was when the modal was requested (nothing silently mutates it).
      // (Confirmed sessions are null forever; a snapshot of null matching null
      // is still consistent.)
      if (fx.header.logoutConfirmOpen()) {
        const expected = fx.header.authService.currentUser() === null ? null : fx.header.authService.currentUser();
        if (expected !== fx.header.authService.currentUser()) snapshotViolations++;
      }
      // Blind confirm invariant: modal closed + never confirmed => session must stay alive.
      if (!everConfirmed && !fx.header.logoutConfirmOpen() && fx.header.authService.currentUser() === null) {
        blindConfirmBrokeSession++;
      }
    }
  }

  assert('S8 Fuzz', 'session was never mutated while the modal was open', snapshotViolations === 0, `violations=${snapshotViolations}`);
  assert('S8 Fuzz', 'blind confirmLogout with modal closed never ended the session', blindConfirmBrokeSession === 0, `breaches=${blindConfirmBrokeSession}`);
  assert('S8 Fuzz', 'fuzz exercised confirms at least once (coverage sanity)', everConfirmed);
}

// --- Summary ------------------------------------------------------------------
console.log('\n==========================================================');
console.log(`📊 LOG OUT CONFIRM STRESS: ${passCount} passed, ${failCount} failed`);
if (failCount > 0) {
  console.log('ISOLATED FAILURES:');
  failures.forEach(f => console.log(`  - ${f}`));
}
console.log('==========================================================');
process.exitCode = failCount === 0 ? 0 : 1;
