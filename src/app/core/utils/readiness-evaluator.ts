/**
 * Publish Readiness Evaluator & Pricing Split Utility
 * Computes 6-item publishing criteria, completion percentage, and 90/10 revenue share.
 */

export interface ReadinessCheckItem {
  id: 'title' | 'description' | 'price' | 'tags' | 'cover' | 'screenshots';
  label: string;
  detail: string;
  complete: boolean;
}

export interface PublishReadinessReport {
  percent: number;
  isReady: boolean;
  items: ReadinessCheckItem[];
}

export interface EarningsSplitResult {
  creatorEarnings: number;
  platformFee: number;
  isFree: boolean;
}

/**
 * Calculates 90% creator earnings vs 10% platform fee.
 */
export function calculateEarningsSplit(price: number): EarningsSplitResult {
  const p = Number(price);
  if (isNaN(p) || p <= 0) {
    return {
      creatorEarnings: 0,
      platformFee: 0,
      isFree: true
    };
  }

  const creatorEarnings = Math.round(p * 0.90 * 100) / 100;
  const platformFee = Math.round((p - creatorEarnings) * 100) / 100;

  return {
    creatorEarnings,
    platformFee,
    isFree: false
  };
}

/**
 * Evaluates live form values against NEXORA publishing standards.
 */
export function evaluatePublishReadiness(formValues: any): PublishReadinessReport {
  const v = formValues || {};

  const titleValid = typeof v.title === 'string' && v.title.trim().length >= 2 && v.title.trim().length <= 100;
  const descValid = typeof v.description === 'string' && v.description.trim().length >= 10;
  const priceNum = Number(v.price);
  const priceValid = !isNaN(priceNum) && priceNum >= 0;
  const tagsValid = Array.isArray(v.tags) && v.tags.length >= 1 && v.tags.length <= 5;
  const coverValid = typeof v.coverImageUrl === 'string' && v.coverImageUrl.trim().length > 0;

  const ss1 = typeof v.screenshot1 === 'string' && v.screenshot1.trim().length > 0;
  const ss2 = typeof v.screenshot2 === 'string' && v.screenshot2.trim().length > 0;
  const ss3 = typeof v.screenshot3 === 'string' && v.screenshot3.trim().length > 0;
  const ss4 = typeof v.screenshot4 === 'string' && v.screenshot4.trim().length > 0;
  // A complete gallery has all 4 screenshots ready (or falling back)
  const screenshotsCount = [ss1, ss2, ss3, ss4].filter(Boolean).length;
  const screenshotsValid = ss1 && (screenshotsCount >= 1);

  const items: ReadinessCheckItem[] = [
    {
      id: 'title',
      label: 'Game Title',
      detail: titleValid ? '2–100 characters valid' : 'Requires 2–100 characters',
      complete: titleValid
    },
    {
      id: 'description',
      label: 'Store Blurb',
      detail: descValid ? 'Minimum 10 characters set' : 'Minimum 10 characters required',
      complete: descValid
    },
    {
      id: 'price',
      label: 'Pricing & Split',
      detail: priceValid ? (priceNum === 0 ? 'Free to play' : `$${priceNum.toFixed(2)} USD`) : 'Invalid price',
      complete: priceValid
    },
    {
      id: 'tags',
      label: 'Genre Tags',
      detail: tagsValid ? `${v.tags.length} tag(s) selected` : 'Select 1–5 store tags',
      complete: tagsValid
    },
    {
      id: 'cover',
      label: 'Cover Artwork',
      detail: coverValid ? '16:9 capsule ready' : 'Cover image required',
      complete: coverValid
    },
    {
      id: 'screenshots',
      label: 'Gallery Media',
      detail: screenshotsCount === 4 ? 'All 4 screenshots ready' : `${screenshotsCount}/4 screenshots uploaded`,
      complete: screenshotsValid
    }
  ];

  const completedCount = items.filter(i => i.complete).length;
  const percent = Math.round((completedCount / items.length) * 100);

  return {
    percent,
    isReady: percent === 100,
    items
  };
}
