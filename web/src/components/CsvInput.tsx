import type { PlayerInput } from "../types";

interface CsvInputProps {
  t: (key: string) => string;
  showBounty: boolean;
  players: PlayerInput[];
  onUpdate: (players: PlayerInput[]) => void;
}

export function CsvInput({ t, showBounty, players, onUpdate }: CsvInputProps) {
  const csvText = players
    .map((p) =>
      showBounty
        ? `${p.name},${p.stack},${p.bounty ?? 10}`
        : `${p.name},${p.stack}`,
    )
    .join("\n");

  const handleInput = (value: string) => {
    const lines = value
      .trim()
      .split("\n")
      .filter((l) => l.trim());
    const parsed: PlayerInput[] = lines.map((line, i) => {
      const parts = line.split(",").map((s) => s.trim());
      return {
        name: parts[0] || `Player ${i + 1}`,
        stack: parseInt(parts[1]) || 1000,
        bounty: parseInt(parts[2]) || 10,
      };
    });

    while (parsed.length < 2) {
      parsed.push({
        name: `Player ${parsed.length + 1}`,
        stack: 1000,
        bounty: 10,
      });
    }
    onUpdate(parsed);
  };

  return (
    <div>
      <p
        style={{
          fontSize: "0.92rem",
          color: "var(--text-tertiary)",
          marginBottom: "8px",
        }}
      >
        {t("csvHint")}
      </p>
      <textarea
        rows={6}
        value={csvText}
        placeholder={"Alice,5000\nBob,3000\nCarol,2000"}
        onInput={(e) => handleInput((e.target as HTMLTextAreaElement).value)}
      />
    </div>
  );
}
