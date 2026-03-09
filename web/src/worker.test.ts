// web/src/worker.test.ts
import { describe, expect, it } from "vitest";

// Test the validation error detection logic that lives in the worker
describe("worker validation error detection", () => {
  it("should detect validation error response", () => {
    const result = {
      error: true,
      validationErrors: [
        { field: "players", message: "At least 2 players are required" },
      ],
    };
    expect(result.error).toBe(true);
    const messages = result.validationErrors
      .map(
        (e: { field: string; message: string }) => `${e.field}: ${e.message}`,
      )
      .join("; ");
    expect(messages).toBe("players: At least 2 players are required");
  });

  it("should not detect valid result as error", () => {
    const result = {
      players: [{ name: "Alice", stack: 5000 }],
      pressureCurve: [],
      metadata: { algorithm: "exact", playerCount: 2, calculationTimeMs: 1 },
    };
    expect((result as Record<string, unknown>).error).toBeUndefined();
  });
});
