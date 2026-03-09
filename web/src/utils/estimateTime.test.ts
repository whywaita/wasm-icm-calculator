import { describe, it, expect } from "vitest";
import { estimateCalcTime } from "./estimateTime";

describe("estimateCalcTime", () => {
  it("returns exact/instant for 10 players (boundary)", () => {
    const result = estimateCalcTime(10);
    expect(result).toEqual({ algorithm: "exact", timeKey: "instant" });
  });

  it("returns approximate/fast for 11 players (boundary)", () => {
    const result = estimateCalcTime(11);
    expect(result).toEqual({ algorithm: "approximate", timeKey: "fast" });
  });

  it("returns approximate/fast for 25 players (boundary)", () => {
    const result = estimateCalcTime(25);
    expect(result).toEqual({ algorithm: "approximate", timeKey: "fast" });
  });

  it("returns approximate/moderate for 26 players (boundary)", () => {
    const result = estimateCalcTime(26);
    expect(result).toEqual({ algorithm: "approximate", timeKey: "moderate" });
  });

  it("returns approximate/moderate for 40 players (boundary)", () => {
    const result = estimateCalcTime(40);
    expect(result).toEqual({ algorithm: "approximate", timeKey: "moderate" });
  });

  it("returns approximate/slow for 41 players (boundary)", () => {
    const result = estimateCalcTime(41);
    expect(result).toEqual({ algorithm: "approximate", timeKey: "slow" });
  });
});
