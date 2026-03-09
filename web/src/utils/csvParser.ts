import type { PlayerInput } from "../types";

const DEFAULT_STACK = 1000;
const DEFAULT_BOUNTY = 10;
const MIN_PLAYERS = 2;

export function parseCsvPlayers(
  csv: string,
  showBounty: boolean,
): PlayerInput[] {
  const lines = csv
    .trim()
    .split("\n")
    .filter((l) => l.trim());

  const parsed: PlayerInput[] = lines.map((line, i) => {
    const parts = line.split(",").map((s) => s.trim());
    const stack = Number(parts[1]);
    const bountyRaw = Number(parts[2]);
    return {
      name: parts[0] || `Player ${i + 1}`,
      stack: Number.isNaN(stack) ? DEFAULT_STACK : stack,
      bounty: Number.isNaN(bountyRaw) ? DEFAULT_BOUNTY : bountyRaw,
    };
  });

  while (parsed.length < MIN_PLAYERS) {
    parsed.push({
      name: `Player ${parsed.length + 1}`,
      stack: DEFAULT_STACK,
      bounty: DEFAULT_BOUNTY,
    });
  }

  return parsed;
}
