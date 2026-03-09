import type { PlayerInput } from "../types";
import { parseCsvPlayers } from "../utils/csvParser";

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
        : `${p.name},${p.stack}`
    )
    .join("\n");

  const handleInput = (value: string) => {
    onUpdate(parseCsvPlayers(value, showBounty));
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
