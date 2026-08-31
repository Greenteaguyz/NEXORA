# Plan: Universal Account Password & Failure Stress Hardening

## Summary
Eliminates the legacy hybrid "passwordless vs password-protected" state across NEXORA. All accounts (including seeded personas Alice Vance and Bob) are provisioned with an initial demo credential (`Password123!`). Authentication strictly requires password verification across the board, developer persona switching seamlessly passes default credentials, the Profile security card is unified into a permanent `Account Password` component with consistent copy, and a 10-case failure stress harness verifies edge conditions under rapid and adversarial load.

## User Story
As an authenticated user,
I want my NEXORA account to always be protected by a password and to change my password via a consistent, secure dialog requiring my current password,
So that my account security follows clear, industry-standard rules without unexpected state bifurcations.

## Problem → Solution
- **Current State**: Seed users have no password; non-seed users can set one. The Profile card flips between "Set Password" and "Change Password", uses confusing conditional status text ("No password set — sign in via email"), and the modal conditionally hides the Current Password field.
- **Desired State**: 100% of accounts have credentials (`Password123!` seeded for demo personas). The Profile card permanently displays `Account Password` with subtitle `Used to sign in to your NEXORA account` and button `[Change Password]`. The modal always requires Current Password $\rightarrow$ New Password $\rightarrow$ Confirm Password, rejects identical passwords, and rate-limits brute force attempts.

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/prds/universal-account-password.prd.md`
- **PRD Phase**: Milestones 1–3
- **Estimated Files**: 5 files

---

## UX Design

### Before
```
┌────────────────────────────────────────────────────────────────────────┐
│  [Lock Icon]  Account Password                                         │
│               No password set — sign in via email        [Set Password]│
└────────────────────────────────────────────────────────────────────────┘
Modal: Conditionally hides "Current Password" input if hasPassword() is false.
```

### After
```
┌────────────────────────────────────────────────────────────────────────┐
│  [Lock Icon]  Account Password                                         │
│               Used to sign in to your NEXORA account  [Change Password]│
└────────────────────────────────────────────────────────────────────────┘
Modal: Always prompts for Current Password, New Password, and Confirm New Password.
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Profile Card Subtitle | Conditional text ("No password set..." vs "Password active...") | Permanent: `Used to sign in to your NEXORA account` | Clear, clean, professional |
| Profile Action Button | Dynamic (`[Set Password]` / `[Change Password]`) | Permanent: `[Change Password]` | Always opens standard change flow |
| Modal Current Password | Hidden when `hasPassword()` was false | Always visible & required | Prevents unauthorized password changes |
| Same Password Input | Not checked | Explicitly rejected | Cannot change password to identical string |
| Persona Switcher | Logged in passwordless | Automatically passes `Password123!` | Preserves instant 1-click dev convenience |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 (critical) | `src/app/core/auth/password-logic.ts` | 1–70 | Pure crypto, validation, and lockout constants |
| P0 (critical) | `src/app/core/auth/auth.mock.ts` | 80–170 | Credential store, password hashing, and authentication verification |
| P1 (important) | `src/app/features/profile/profile.component.ts` | 40–120 | Form state, validation getters, and lockout timers |
| P1 (important) | `src/app/features/profile/profile.component.html` | 180–300 | Card markup and change password dialog |
| P2 (reference) | `tests/stress/change-password-stress.ts` | 1–340 | Standalone Node test fixture and assertions |

---

## Patterns to Mirror

### CREDENTIAL_SEED_PATTERN
```typescript
// SOURCE: src/app/core/auth/auth.mock.ts
export const DEFAULT_SEED_PASSWORD = 'Password123!';
export const SEED_SALT = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
export const SEED_HASH = '24fc75a1b809f8a6037dd9f08fa0d31901ad902fca31d9b9c411ce605b30823f';

// In constructor:
SEED_USERS.forEach(u => {
  if (!this.credentials[u.id]) {
    this.credentials[u.id] = {
      salt: SEED_SALT,
      hash: SEED_HASH,
      updatedAt: new Date().toISOString()
    };
  }
});
```

### AUTHENTICATE_VERIFICATION_PATTERN
```typescript
// SOURCE: src/app/core/auth/auth.mock.ts
authenticate(credentials: LoginCredentials): Observable<User> {
  const emailLower = credentials.email.toLowerCase().trim();
  const user = this.users.find(u => u.email.toLowerCase() === emailLower);
  if (!user) {
    return throwError(() => new Error('Incorrect email or password'));
  }
  const cred = this.credentials[user.id];
  if (!cred || !credentials.password) {
    return throwError(() => new Error('Incorrect email or password'));
  }
  return from(verifyPassword(credentials.password, cred.salt, cred.hash)).pipe(
    switchMap(isValid => {
      if (isValid) return of(user).pipe(delay(120));
      return throwError(() => new Error('Incorrect email or password'));
    })
  );
}
```

### SAME_PASSWORD_VALIDATION_PATTERN
```typescript
// SOURCE: src/app/features/profile/profile.component.ts
if (this.currentPassword.trim() === this.newPassword.trim()) {
  this.passwordError = 'New password cannot be the same as your current password';
  return;
}
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/app/core/auth/auth.mock.ts` | UPDATE | Pre-seed default credentials for all `SEED_USERS`; enforce password check on all logins |
| `src/app/core/auth/auth.service.ts` | UPDATE | Update `switchDemoUser` to pass `DEFAULT_SEED_PASSWORD` |
| `src/app/features/profile/profile.component.ts` | UPDATE | Remove passwordless conditionals; require current password; add same-password check |
| `src/app/features/profile/profile.component.html` | UPDATE | Unify card description to `Used to sign in to your NEXORA account`; remove `@if (hasPassword())` branches |
| `tests/integration/integration-tests.spec.ts` | UPDATE | Update Suite 18 assertions to verify universal password model |
| `tests/unit/unit-tests.spec.ts` | UPDATE | Update unit tests to verify seed credentials and password requirements |
| `tests/stress/change-password-stress.ts` | UPDATE | Add 10-scenario comprehensive failure test battery |

## NOT Building

- SMS / 2FA Authenticator TOTP.
- Multi-factor recovery backup codes.
- OAuth token integration.

---

## Step-by-Step Tasks

### Task 1: Pre-seed Credentials & Strict Auth in `auth.mock.ts`
- **ACTION**: Define `DEFAULT_SEED_PASSWORD`, `SEED_SALT`, `SEED_HASH`; pre-seed credentials for all `SEED_USERS`.
- **IMPLEMENT**: In `authenticate()`, eliminate passwordless bypass; require credentials and verify hash for all accounts.
- **MIRROR**: `CREDENTIAL_SEED_PATTERN` and `AUTHENTICATE_VERIFICATION_PATTERN`.
- **VALIDATE**: `node -e "..."` verifying `authenticate` rejects missing password on Alice.

### Task 2: Update `switchDemoUser` in `auth.service.ts`
- **ACTION**: Update `switchDemoUser(email)` to pass `password: DEFAULT_SEED_PASSWORD`.
- **IMPLEMENT**: Ensures one-click dev/header persona switcher continues working seamlessly.
- **VALIDATE**: `npm run test:unit`

### Task 3: Unify Profile Component & Modal
- **ACTION**: In `profile.component.ts`, update `isChangePasswordFormValid` to always require `currentPassword.trim().length > 0`; add same-password check.
- **IMPLEMENT**: In `profile.component.html`, remove all conditional `@if (hasPassword())` branches. Subtitle is permanently `Used to sign in to your NEXORA account`. Action button is permanently `Change Password`. Modal title is permanently `Change Password`. Current password input is always rendered.
- **VALIDATE**: Zero TypeScript errors; integration tests pass.

### Task 4: Expand Failure Stress Battery in `change-password-stress.ts`
- **ACTION**: Implement 10 comprehensive failure cases:
  1. FC1: Login without password fails
  2. FC2: Change password with empty current password fails
  3. FC3: Same-password submission rejected
  4. FC4: Weak password submissions (<8 chars, no letter, no digit) rejected
  5. FC5: Wrong current password tracking (4 attempts count down)
  6. FC6: 5th wrong attempt triggers 60s lockout
  7. FC7: Active lockout blocks all attempts (even with correct current password)
  8. FC8: Double-submit single write protection
  9. FC9: Lockout expiry allows successful recovery
  10. FC10: Credential leak protection (User model and session never contain plaintext or hash)
- **VALIDATE**: `npx tsc src/app/features/profile/profile.component.ts tests/stress/change-password-stress.ts ... && node ...`

### Task 5: Run Full Verification
- **ACTION**: Run `npm run verify`.
- **VALIDATE**: Build green, unit tests 100%, integration tests 100%, master battery 100%, impeccable 100%.

---

## Testing Strategy

### 10 Failure Scenarios Checklist

| Test ID | Scenario | Input | Expected Output |
|---|---|---|---|
| **FC1** | Missing password on login | `{ email: 'alice@nexora.games' }` | Error: `Incorrect email or password` |
| **FC2** | Missing current password | `changePassword(alice.id, '', 'NewPass123')` | Error: `Current password is required` |
| **FC3** | Same password rejection | `current = 'Password123!', next = 'Password123!'` | Error / rejected before write |
| **FC4** | Under-length password | `next = 'Ab1'` | Validation failure (`at least 8 characters`) |
| **FC5** | Missing digit | `next = 'PasswordOnly'` | Validation failure (`at least one number`) |
| **FC6** | Missing letter | `next = '12345678'` | Validation failure (`at least one letter`) |
| **FC7** | Decreasing attempt counter | 4 wrong attempts | `ERR_INCORRECT_PASSWORD` with attempts 4 $\rightarrow$ 1 |
| **FC8** | Lockout engagement | 5th wrong attempt | `ERR_LOCKED_OUT` with 60,000ms duration |
| **FC9** | Bypass rejection during lock | Correct password during lock | Immediately rejected with `ERR_LOCKED_OUT` |
| **FC10** | Expiry recovery | Locked user with `Date.now() >= lockedUntil` | Allows valid change; clears lockout state |

---

## Validation Commands

```bash
# Stress Harness Execution
npx tsc src/app/features/profile/profile.component.ts tests/stress/change-password-stress.ts --rootDir . --outDir dist --module commonjs --target es2022 --skipLibCheck && node dist/tests/stress/change-password-stress.js

# Integration Tests
npm run test:integration

# Unit Tests
npm run test:unit

# Full Quality Gate
npm run verify
```

---

## Acceptance Criteria
- [ ] Universal seed credentials configured (`Password123!`)
- [ ] Login strictly verifies password for all accounts
- [ ] Persona switcher seamlessly passes demo credentials
- [ ] Profile card displays permanent `Account Password`, `Used to sign in to your NEXORA account`, and `Change Password`
- [ ] Modal always requires Current Password and rejects identical new password
- [ ] 10 failure stress tests pass (100%)
- [ ] `npm run verify` passes with 0 failures
- [ ] Changes left uncommitted in working tree
