// ---------------------------------------------------------------------------
// STRESS HARNESS: Account Security & Change Password (Profile & AuthMock)
// Isolates failure cases under rapid/concurrent/fuzzed interaction.
// Run: npx tsc src/app/features/profile/profile.component.ts tests/stress/change-password-stress.ts --rootDir . --outDir dist
//      --module commonjs --target es2022 --skipLibCheck
//      && node dist/tests/stress/change-password-stress.js
// ---------------------------------------------------------------------------
import '@angular/compiler';
import { Injector, PLATFORM_ID, runInInjectionContext, ɵINJECTOR_SCOPE } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, of, firstValueFrom } from 'rxjs';
import { AuthService } from '../../src/app/core/auth/auth.service';
import { LocalStoreService } from '../../src/app/core/persistence/local-store.service';
import { AuthMockService, DEFAULT_SEED_PASSWORD } from '../../src/app/core/auth/auth.mock';
import { ToastService } from '../../src/app/core/services/toast.service';
import {
  PASSWORD_MIN_LENGTH,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  ERR_INCORRECT_PASSWORD,
  ERR_LOCKED_OUT,
  generateSalt,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  passwordStrengthScore,
  getLockoutRemainingMs
} from '../../src/app/core/auth/password-logic';
import {
  PAYMENTS_DATA,
  USERS_DATA,
  LIBRARY_DATA,
  WISHLIST_DATA,
  ORDERS_DATA,
  GAMES_DATA
} from '../../src/app/core/data/tokens';
import { SEED_USERS } from '../../src/app/core/data/seed-data';

// Component stubs for Node JIT-safe loading
const nodeModule = require('module') as { _extensions: Record<string, (m: any, f: string) => void> };
const originalJsHandler = nodeModule._extensions['.js'];
nodeModule._extensions['.js'] = function (modInstance: { _compile: (code: string, f: string) => void }, filename: string) {
  if (filename.endsWith('role-badge.component.js')) {
    modInstance._compile('class RoleBadgeStub {}\nmodule.exports = { RoleBadgeComponent: RoleBadgeStub };', filename);
    return;
  }
  if (filename.endsWith('scroll-lock.directive.js')) {
    modInstance._compile('class ScrollLockStub {}\nmodule.exports = { ScrollLockDirective: ScrollLockStub };', filename);
    return;
  }
  originalJsHandler(modInstance, filename);
};

// Lazy require of profile component
const profileModule = require('../../src/app/features/profile/profile.component') as { ProfileComponent: any };
const ProfileComponent = profileModule.ProfileComponent;

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

// --- Fixture factory -------------------------------------------------------
interface ProfileFixture {
  component: any;
  authService: AuthService;
  authMock: AuthMockService;
  localStore: LocalStoreService;
  toastService: ToastService;
}

function createProfileFixture(): ProfileFixture {
  const injector = Injector.create({
    providers: [
      { provide: ɵINJECTOR_SCOPE, useValue: 'root' },
      { provide: PLATFORM_ID, useValue: 'server' },
      { provide: Router, useValue: { events: new Subject<any>(), url: '/profile', navigate: () => Promise.resolve(true) } },
      { provide: PAYMENTS_DATA, useValue: { getPaymentMethods: () => of([]), getTransactions: () => of([]), getGiftCards: () => of([]), getWalletBalance: () => of(0) } },
      { provide: USERS_DATA, useValue: { getUsers: () => of(SEED_USERS), getUserById: () => of(SEED_USERS[0]) } },
      { provide: LIBRARY_DATA, useValue: { getLibrary: () => of([]) } },
      { provide: WISHLIST_DATA, useValue: { getWishlist: () => of([]) } },
      { provide: ORDERS_DATA, useValue: { getOrders: () => of([]) } },
      { provide: GAMES_DATA, useValue: { getGames: () => of([]) } },
      LocalStoreService,
      AuthMockService,
      AuthService,
      ToastService
    ]
  });

  const component = runInInjectionContext(injector, () => new ProfileComponent());
  return {
    component,
    authService: injector.get(AuthService),
    authMock: injector.get(AuthMockService),
    localStore: injector.get(LocalStoreService),
    toastService: injector.get(ToastService)
  };
}

async function runAllStressSuites() {
  console.log('\n==========================================================');
  console.log('🚀 NEXORA CHANGE PASSWORD & CREDENTIAL SECURITY STRESS BATTERY');
  console.log('==========================================================\n');

  // --- S1: Rapid modal open/close 2000x -------------------------------------
  {
    const fx = createProfileFixture();
    let focusRestoredCount = 0;
    const triggerEl = {
      focus: () => { focusRestoredCount++; }
    };

    for (let i = 0; i < 2000; i++) {
      fx.component.openChangePasswordModal({ currentTarget: triggerEl } as unknown as MouseEvent);
      fx.component.currentPassword = 'tempCurrentPassword1';
      fx.component.newPassword = 'tempNewPassword2';
      fx.component.confirmPassword = 'tempNewPassword2';
      fx.component.closeChangePasswordModal();
    }

    assert('S1 Rapid Modal', 'Modal closed after 2000 cycles', fx.component.showChangePasswordModal === false);
    assert('S1 Rapid Modal', 'Form state cleanly reset after 2000 cycles',
      fx.component.currentPassword === '' && fx.component.newPassword === '' && fx.component.confirmPassword === '');
    assert('S1 Rapid Modal', 'Focus restored to opener on every dismissal (2000/2000)', focusRestoredCount === 2000);
  }

  // --- S2: Double-submit single write guard ---------------------------------
  {
    const fx = createProfileFixture();
    const testUser = SEED_USERS[0];
    fx.authService.currentUser.set(testUser);

    fx.component.openChangePasswordModal();
    fx.component.currentPassword = DEFAULT_SEED_PASSWORD;
    fx.component.newPassword = 'ValidPassword123';
    fx.component.confirmPassword = 'ValidPassword123';

    // Track write calls to authMock
    let writeCount = 0;
    const originalChange = fx.authMock.changePassword.bind(fx.authMock);
    fx.authMock.changePassword = (id: string, curr: string, next: string) => {
      writeCount++;
      return originalChange(id, curr, next);
    };

    // First submit engages saving
    fx.component.submitChangePassword();
    // Second submit is synchronous double-submit attempt
    fx.component.submitChangePassword();

    assert('S2 Double Submit', 'Concurrent/double submit executes exactly one backend write', writeCount === 1);
  }

  // --- S3: Wrong-password x5 -> locked + countdown + verify rejected --------
  {
    const fx = createProfileFixture();
    const testUser = SEED_USERS[1];
    fx.authService.currentUser.set(testUser);

    // Initial setup: set a known password
    await firstValueFrom(fx.authMock.changePassword(testUser.id, DEFAULT_SEED_PASSWORD, 'CurrentPass123'));

    let attemptErrors: string[] = [];
    for (let i = 1; i <= 4; i++) {
      try {
        await firstValueFrom(fx.authMock.changePassword(testUser.id, 'WrongPass123', 'NextValidPass1'));
      } catch (err: any) {
        attemptErrors.push(err.code);
      }
    }

    assert('S3 Lockout', 'First 4 wrong attempts reject with ERR_INCORRECT_PASSWORD',
      attemptErrors.length === 4 && attemptErrors.every(c => c === ERR_INCORRECT_PASSWORD));

    // 5th wrong attempt engages lockout
    let lockError: any = null;
    try {
      await firstValueFrom(fx.authMock.changePassword(testUser.id, 'WrongPass123', 'NextValidPass1'));
    } catch (err: any) {
      lockError = err;
    }

    assert('S3 Lockout', '5th failed attempt engages ERR_LOCKED_OUT', lockError?.code === ERR_LOCKED_OUT);
    assert('S3 Lockout', 'Lockout duration is 60_000ms', lockError?.remainingMs === LOCKOUT_DURATION_MS);

    // Attempt 6 during lock (even with correct current password) is immediately rejected
    let lockBypassAttempt: any = null;
    try {
      await firstValueFrom(fx.authMock.changePassword(testUser.id, 'CurrentPass123', 'NextValidPass1'));
    } catch (err: any) {
      lockBypassAttempt = err;
    }

    assert('S3 Lockout', 'Correct password rejected while lockout is active', lockBypassAttempt?.code === ERR_LOCKED_OUT);
  }

  // --- S4: Lock expiry restores attempts ------------------------------------
  {
    const fx = createProfileFixture();
    const testUser = SEED_USERS[1];
    fx.authService.currentUser.set(testUser);

    // Engage lockout with 5 wrong attempts
    for (let i = 0; i < 5; i++) {
      try {
        await firstValueFrom(fx.authMock.changePassword(testUser.id, 'WrongPass123', 'NextValidPass1'));
      } catch {}
    }

    const lockState = fx.authMock.getLockoutState(testUser.id);
    assert('S4 Lock Expiry', 'User is currently locked', !!lockState && (lockState.lockedUntil || 0) > Date.now());

    // Advance time past lockout window
    if (lockState) {
      lockState.lockedUntil = Date.now() - 1000;
    }

    // Now correct password succeeds
    const updated = await firstValueFrom(fx.authMock.changePassword(testUser.id, DEFAULT_SEED_PASSWORD, 'RestoredPass123'));
    assert('S4 Lock Expiry', 'Expired lock allows valid password change', updated.id === testUser.id);
    assert('S4 Lock Expiry', 'Successful change resets lockout state', fx.authMock.getLockoutState(testUser.id) === undefined);
  }

  // --- S5: Hash determinism + unique salts 500x -----------------------------
  {
    const salts = new Set<string>();
    for (let i = 0; i < 500; i++) {
      salts.add(generateSalt());
    }
    assert('S5 Crypto', '500 generated salts are 100% distinct', salts.size === 500);

    const sampleSalt = Array.from(salts)[0];
    const hash1 = await hashPassword('DeterminismCheck123', sampleSalt);
    const hash2 = await hashPassword('DeterminismCheck123', sampleSalt);
    assert('S5 Crypto', 'hashPassword is 100% deterministic given identical inputs', hash1 === hash2);

    const verifyMatches = await verifyPassword('DeterminismCheck123', sampleSalt, hash1);
    const verifyMismatches = await verifyPassword('WrongPw123', sampleSalt, hash1);
    assert('S5 Crypto', 'verifyPassword is cryptographically sound', verifyMatches === true && verifyMismatches === false);
  }

  // --- S6: Seeded Fuzz Battery (mulberry32, 600x24) -------------------------
  {
    const fx = createProfileFixture();
    const testUser = SEED_USERS[0];
    fx.authService.currentUser.set(testUser);

    let seed = 0xCAFE_BABE;
    const rand = () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const dummyPasswords = [
      'ValidPass1',
      'StrongPassword123!@#',
      'short1',
      'letters_only_pass',
      '12345678',
      'CorrectPassword999',
      'AnotherGoodOne88'
    ];

    let leakViolations = 0;
    let negativeAttempts = 0;
    let bypassViolations = 0;

    for (let cycle = 0; cycle < 600; cycle++) {
      for (let step = 0; step < 24; step++) {
        const roll = rand();
        if (roll < 0.20) {
          fx.component.openChangePasswordModal();
          fx.component.currentPassword = DEFAULT_SEED_PASSWORD;
        } else if (roll < 0.40) {
          fx.component.closeChangePasswordModal();
        } else if (roll < 0.55) {
          fx.component.newPassword = dummyPasswords[Math.floor(rand() * dummyPasswords.length)];
        } else if (roll < 0.70) {
          fx.component.confirmPassword = rand() < 0.5 ? fx.component.newPassword : 'mismatchPassword';
        } else if (roll < 0.85) {
          if (fx.component.showChangePasswordModal && fx.component.isChangePasswordFormValid && !fx.component.savingPassword) {
            fx.component.submitChangePassword();
          }
        } else {
          // Check lockout state inspection
          const state = fx.authMock.getLockoutState(testUser.id);
          if (state && state.failedAttempts < 0) {
            negativeAttempts++;
          }
          if (state && getLockoutRemainingMs(state) > 0) {
            // Invariant: cannot bypass lock
            if (fx.component.isChangePasswordFormValid && fx.component.lockoutRemainingSeconds === 0) {
              // Valid form must not report valid if locked
              bypassViolations++;
            }
          }
        }

        // Live Invariant Check: Plaintext credentials NEVER in User model or auth_users store
        const currentUser = fx.authService.currentUser();
        if (currentUser && ('password' in currentUser || 'hash' in currentUser || 'salt' in currentUser)) {
          leakViolations++;
        }
        const storedUsers = fx.localStore.getItem<any[]>('auth_users');
        if (storedUsers && storedUsers.some(u => 'password' in u || 'hash' in u || 'salt' in u)) {
          leakViolations++;
        }
      }
    }

    assert('S6 Fuzz', 'Zero credential leaks in User or auth_users throughout 14,400 fuzz operations', leakViolations === 0);
    assert('S6 Fuzz', 'Failed attempts counter was never negative', negativeAttempts === 0);
    assert('S6 Fuzz', 'Lockout was never bypassed', bypassViolations === 0);
  }

  // --- S7: Dedicated 10 Failure Cases Battery -------------------------------
  {
    const fx = createProfileFixture();
    const testUser = SEED_USERS[0]; // Alice
    fx.authService.currentUser.set(testUser);

    // FC1: Missing password on login fails
    let fc1Failed = false;
    try {
      await firstValueFrom(fx.authMock.authenticate({ email: testUser.email }));
    } catch (e: any) {
      fc1Failed = e.message === 'Incorrect email or password';
    }
    assert('S7 Failure Suite', 'FC1: Login without password fails', fc1Failed);

    // FC2: Wrong password on login fails
    let fc2Failed = false;
    try {
      await firstValueFrom(fx.authMock.authenticate({ email: testUser.email, password: 'WrongPassword99!' }));
    } catch (e: any) {
      fc2Failed = e.message === 'Incorrect email or password';
    }
    assert('S7 Failure Suite', 'FC2: Login with wrong password fails', fc2Failed);

    // FC3: Missing current password on change rejected
    let fc3Failed = false;
    try {
      await firstValueFrom(fx.authMock.changePassword(testUser.id, '', 'NewValidPass123'));
    } catch (e: any) {
      fc3Failed = e.message === 'Current password is required';
    }
    assert('S7 Failure Suite', 'FC3: Change password without current password fails', fc3Failed);

    // FC4: Same password change rejected by mock
    let fc4Failed = false;
    try {
      await firstValueFrom(fx.authMock.changePassword(testUser.id, DEFAULT_SEED_PASSWORD, DEFAULT_SEED_PASSWORD));
    } catch (e: any) {
      fc4Failed = e.message === 'New password cannot be the same as your current password';
    }
    assert('S7 Failure Suite', 'FC4: Change password to identical password fails', fc4Failed);

    // FC5: Component form marked invalid on same password
    fx.component.openChangePasswordModal();
    fx.component.currentPassword = DEFAULT_SEED_PASSWORD;
    fx.component.newPassword = DEFAULT_SEED_PASSWORD;
    fx.component.confirmPassword = DEFAULT_SEED_PASSWORD;
    assert('S7 Failure Suite', 'FC5: Component form rejects identical new password', fx.component.isChangePasswordFormValid === false);

    // FC6: Weak passwords fail validation
    const shortVal = validatePasswordStrength('Short1');
    const noNumVal = validatePasswordStrength('NoNumbersHere!');
    const noLetterVal = validatePasswordStrength('1234567890');
    assert('S7 Failure Suite', 'FC6: Weak password rules reject short, letter-only, and digit-only passwords',
      !shortVal.valid && !noNumVal.valid && !noLetterVal.valid);

    // FC7: Wrong current password decrements attemptsRemaining
    const testUser2 = SEED_USERS[2] || SEED_USERS[1];
    let attemptsSeq: number[] = [];
    for (let i = 0; i < 4; i++) {
      try {
        await firstValueFrom(fx.authMock.changePassword(testUser2.id, 'WrongPass!', 'NewValidPass123'));
      } catch (e: any) {
        if (e.code === ERR_INCORRECT_PASSWORD) {
          attemptsSeq.push(e.attemptsRemaining);
        }
      }
    }
    assert('S7 Failure Suite', 'FC7: Decreasing attempt counter tracks 4 -> 3 -> 2 -> 1',
      JSON.stringify(attemptsSeq) === JSON.stringify([4, 3, 2, 1]));

    // FC8: 5th wrong attempt triggers 60s lockout
    let lockErr: any = null;
    try {
      await firstValueFrom(fx.authMock.changePassword(testUser2.id, 'WrongPass!', 'NewValidPass123'));
    } catch (e: any) {
      lockErr = e;
    }
    assert('S7 Failure Suite', 'FC8: 5th wrong attempt triggers 60s lockout',
      lockErr?.code === ERR_LOCKED_OUT && lockErr?.remainingMs === LOCKOUT_DURATION_MS);

    // FC9: Active lockout rejects correct password attempt immediately
    let bypassErr: any = null;
    try {
      await firstValueFrom(fx.authMock.changePassword(testUser2.id, DEFAULT_SEED_PASSWORD, 'NewValidPass123'));
    } catch (e: any) {
      bypassErr = e;
    }
    assert('S7 Failure Suite', 'FC9: Active lockout rejects correct password attempt immediately',
      bypassErr?.code === ERR_LOCKED_OUT);

    // FC10: Lockout expiry recovery
    const lockState = fx.authMock.getLockoutState(testUser2.id);
    if (lockState) {
      lockState.lockedUntil = Date.now() - 1000;
    }
    const recovered = await firstValueFrom(fx.authMock.changePassword(testUser2.id, DEFAULT_SEED_PASSWORD, 'RecoveredPass123'));
    assert('S7 Failure Suite', 'FC10: Lockout expiry allows successful recovery with correct password',
      recovered.id === testUser2.id && fx.authMock.getLockoutState(testUser2.id) === undefined);
  }

  // --- Summary -------------------------------------------------------------
  console.log('\n==========================================================');
  console.log(`📊 CHANGE PASSWORD STRESS: ${passCount} passed, ${failCount} failed`);
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
