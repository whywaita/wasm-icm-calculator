export interface CalcEstimate {
  algorithm: "exact" | "approximate";
  timeKey: "instant" | "fast" | "moderate";
}

const EXACT_PLAYER_THRESHOLD = 10;
const FAST_MC_THRESHOLD = 25;

export function estimateCalcTime(playerCount: number): CalcEstimate {
  if (playerCount <= EXACT_PLAYER_THRESHOLD) {
    return { algorithm: "exact", timeKey: "instant" };
  }
  if (playerCount <= FAST_MC_THRESHOLD) {
    return { algorithm: "approximate", timeKey: "fast" };
  }
  return { algorithm: "approximate", timeKey: "moderate" };
}
