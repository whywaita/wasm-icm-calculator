export interface CalcEstimate {
  algorithm: "exact" | "approximate";
  timeKey: "instant" | "fast" | "moderate" | "slow";
}

const EXACT_PLAYER_THRESHOLD = 10;
const FAST_MC_THRESHOLD = 25;
const MODERATE_MC_THRESHOLD = 40;

export function estimateCalcTime(playerCount: number): CalcEstimate {
  if (playerCount <= EXACT_PLAYER_THRESHOLD) {
    return { algorithm: "exact", timeKey: "instant" };
  }
  if (playerCount <= FAST_MC_THRESHOLD) {
    return { algorithm: "approximate", timeKey: "fast" };
  }
  if (playerCount <= MODERATE_MC_THRESHOLD) {
    return { algorithm: "approximate", timeKey: "moderate" };
  }
  return { algorithm: "approximate", timeKey: "slow" };
}
