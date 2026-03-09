/**
 * Generate a standard MTT payout structure for given entries and payout percentage.
 *
 * Uses a power-law distribution: weight[i] = 1 / i^alpha
 * Alpha is tuned so larger fields are more top-heavy.
 */
export function generateMttPayouts(
  totalEntries: number,
  topPercent: number,
): number[] {
  const paidCount = Math.max(1, Math.round(totalEntries * (topPercent / 100)));

  // Alpha controls top-heaviness. Larger fields → slightly more top-heavy.
  const alpha = paidCount <= 3 ? 0.9 : paidCount <= 9 ? 0.75 : 0.65;

  const weights: number[] = [];
  for (let i = 1; i <= paidCount; i++) {
    weights.push(1 / Math.pow(i, alpha));
  }

  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const payouts = weights.map((w) =>
    Math.round((w / totalWeight) * 10000) / 100
  );

  // Adjust rounding so percentages sum to exactly 100
  const sum = payouts.reduce((s, v) => s + v, 0);
  payouts[0] += Math.round((100 - sum) * 100) / 100;

  return payouts;
}

export interface MttPayoutPreset {
  key: string;
  topPercent: number;
}

export const MTT_PAYOUT_PRESETS: MttPayoutPreset[] = [
  { key: "top5", topPercent: 5 },
  { key: "top10", topPercent: 10 },
  { key: "top15", topPercent: 15 },
  { key: "top20", topPercent: 20 },
];
