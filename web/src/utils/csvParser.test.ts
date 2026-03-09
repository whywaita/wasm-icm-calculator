import { describe, it, expect } from "vitest";
import { parseCsvPlayers } from "./csvParser";

describe("parseCsvPlayers", () => {
  it("parses basic CSV", () => {
    const result = parseCsvPlayers("Alice,5000\nBob,3000", false);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "Alice", stack: 5000, bounty: 10 });
    expect(result[1]).toEqual({ name: "Bob", stack: 3000, bounty: 10 });
  });

  it("preserves bounty=0", () => {
    const result = parseCsvPlayers("Alice,5000,0", true);
    expect(result[0].bounty).toBe(0);
  });

  it("uses default bounty when not provided", () => {
    const result = parseCsvPlayers("Alice,5000", true);
    expect(result[0].bounty).toBe(10);
  });

  it("uses default stack for invalid number", () => {
    const result = parseCsvPlayers("Alice,abc", false);
    expect(result[0].stack).toBe(1000);
  });

  it("pads to minimum 2 players", () => {
    const result = parseCsvPlayers("Alice,5000", false);
    expect(result).toHaveLength(2);
    expect(result[1].name).toBe("Player 2");
  });

  it("handles empty input", () => {
    const result = parseCsvPlayers("", false);
    expect(result).toHaveLength(2);
  });
});
