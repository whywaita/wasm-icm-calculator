import { describe, expect, it } from "vitest";
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

  it("returns approximate/slow for 100 players (boundary)", () => {
    const result = estimateCalcTime(100);
    expect(result).toEqual({ algorithm: "approximate", timeKey: "slow" });
  });

  it("returns approximate/verySlow for 101 players (boundary)", () => {
    const result = estimateCalcTime(101);
    expect(result).toEqual({ algorithm: "approximate", timeKey: "verySlow" });
  });

  it("returns approximate/verySlow for 200 players", () => {
    const result = estimateCalcTime(200);
    expect(result).toEqual({ algorithm: "approximate", timeKey: "verySlow" });
  });
});
