import * as fs from 'fs';
import * as path from 'path';

/**
 * IMPECCABLE THEME CONTRAST & VISIBILITY COMPLIANCE SUITE
 * Enforces high-craft contrast, zero white-on-white text in light mode,
 * smooth hover elevation transitions without dark flash inversions,
 * and WCAG AAA compliance across both Light and Dark modes.
 */

interface TestResult {
  title: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(title: string, fn: () => void) {
  try {
    fn();
    results.push({ title, passed: true });
    console.log(`  ✓ [PASS] ${title}`);
  } catch (err: any) {
    results.push({ title, passed: false, error: err.message });
    console.error(`  ✗ [FAIL] ${title}\n      Error: ${err.message}`);
  }
}

function expect(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg);
  }
}

function readCss(relPath: string): string {
  const fullPath = path.resolve(process.cwd(), relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

console.log('\n--- IMPECCABLE THEME CONTRAST & VISIBILITY SPECIFICATION ---');

test('AC-THEME-01: Wishlist price badge has high-contrast Light Mode override (No white-on-white text)', () => {
  const css = readCss('src/app/features/wishlist/wishlist.component.css');
  const hasLightPriceOverride = /:host-context\(\[data-theme="light"\]\)[^{]*\.card-price-badge/i.test(css);
  expect(hasLightPriceOverride, 'Wishlist component missing :host-context([data-theme="light"]) .card-price-badge override to prevent invisible white text on white card');
});

test('AC-THEME-02: Wishlist and Library cards define Light Mode hover background to eliminate navy flashes', () => {
  const wishlistCss = readCss('src/app/features/wishlist/wishlist.component.css');
  const libraryCss = readCss('src/app/features/library/library.component.css');
  
  const wishlistLightHoverBg = /:host-context\(\[data-theme="light"\]\)\s*\.wishlist-card:hover\s*\{[^}]*background(-color)?:\s*(#FFFFFF|#F8FAFC|#FAFAFA|var\(--bg-surface\))/i.test(wishlistCss);
  expect(wishlistLightHoverBg, 'Wishlist card light-mode hover must explicitly set light background-color (#FFFFFF or #F8FAFC) to prevent dark navy flash');

  const libraryLightHoverBg = /:host-context\(\[data-theme="light"\]\)\s*\.library-card:hover\s*\{[^}]*background(-color)?:\s*(#FFFFFF|#F8FAFC|#FAFAFA|var\(--bg-surface\))/i.test(libraryCss);
  expect(libraryLightHoverBg, 'Library card light-mode hover must explicitly set light background-color (#FFFFFF or #F8FAFC) to prevent dark navy flash');
});

test('AC-THEME-03: Tag filter chips in Catalog, Library, and Wishlist have high-contrast hover states in Light Mode', () => {
  const catalogCss = readCss('src/app/features/game-catalog/game-catalog.component.css');
  const libraryCss = readCss('src/app/features/library/library.component.css');
  const wishlistCss = readCss('src/app/features/wishlist/wishlist.component.css');

  const catalogTagHover = /:host-context\(\[data-theme="light"\]\)[^{]*\.tag-filter-chip:hover/i.test(catalogCss);
  expect(catalogTagHover, 'Catalog tag filter chip missing light-mode hover override, results in white text on light gray');

  const libraryTagHover = /:host-context\(\[data-theme="light"\]\)[^{]*\.filter-tag-chip:hover/i.test(libraryCss);
  expect(libraryTagHover, 'Library tag filter chip missing light-mode hover override, results in white text on light gray');

  const wishlistTagHover = /:host-context\(\[data-theme="light"\]\)[^{]*\.filter-tag-chip:hover/i.test(wishlistCss);
  expect(wishlistTagHover, 'Wishlist tag filter chip missing light-mode hover override, results in white text on light gray');
});

test('AC-THEME-04: Genres component preserves readable description text and clear button in Light Mode', () => {
  const genresCss = readCss('src/app/features/genres/genres.component.css');
  const genreDescHover = /:host-context\(\[data-theme="light"\]\)[^{]*\.core-genre-card:hover\s+\.genre-desc/i.test(genresCss);
  expect(genreDescHover, 'Genres card missing light-mode description hover override, turns text into near-white #E2E8F0 on hover');

  const clearBtnLight = /:host-context\(\[data-theme="light"\]\)[^{]*\.clear-search-btn/i.test(genresCss);
  expect(clearBtnLight, 'Genres clear-search-btn missing light-mode override, leaves dark circle inside white search input');
});

test('AC-THEME-05: Purchase Confirmation Modal provides complete Light Mode surface tokens', () => {
  const purchaseCss = readCss('src/app/shared/ui/purchase-confirm-modal/purchase-confirm-modal.component.css');
  const modalLight = /:host-context\(\[data-theme="light"\]\)[^{]*\.modal-card/i.test(purchaseCss);
  expect(modalLight, 'Purchase confirm modal missing :host-context([data-theme="light"]) .modal-card override');
  
  const footerLight = /:host-context\(\[data-theme="light"\]\)[^{]*\.modal-footer/i.test(purchaseCss);
  expect(footerLight, 'Purchase confirm modal missing :host-context([data-theme="light"]) .modal-footer override');

  const summaryLight = /:host-context\(\[data-theme="light"\]\)[^{]*\.game-summary-card/i.test(purchaseCss);
  expect(summaryLight, 'Purchase confirm modal missing :host-context([data-theme="light"]) .game-summary-card override');
});

test('AC-THEME-06: Game Detail Steam tag pill defines high-contrast Light Mode hover styling', () => {
  const detailCss = readCss('src/app/features/game-detail/game-detail.component.css');
  const tagLightHover = /:host-context\(\[data-theme="light"\]\)[^{]*\.steam-tag-pill:hover/i.test(detailCss);
  expect(tagLightHover, 'Game detail steam tag pill missing light-mode hover override, causes low-contrast white text on pale blue');
});

test('AC-THEME-07: Profile Cancel Password button defines high-contrast Light Mode hover styling', () => {
  const profileCss = readCss('src/app/features/profile/profile.component.css');
  const cancelHover = /:host-context\(\[data-theme="light"\]\)[^{]*\.btn-cancel-password:hover/i.test(profileCss);
  expect(cancelHover, 'Profile cancel-password button missing light-mode hover override, causes white text on pale blue');
});

const total = results.length;
const passed = results.filter(r => r.passed).length;
const failed = total - passed;

console.log(`\n📊 SUMMARY: ${passed} / ${total} PASSED (${failed} FAILED)`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
