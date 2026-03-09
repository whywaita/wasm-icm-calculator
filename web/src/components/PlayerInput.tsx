import { useState } from "preact/hooks";
import { PlayerTable } from "./PlayerTable";
import { CsvInput } from "./CsvInput";
import type { PlayerInput as PlayerInputType } from "../types";

interface PlayerInputProps {
  t: (key: string) => string;
  players: PlayerInputType[];
  showBounty: boolean;
  onUpdate: (players: PlayerInputType[]) => void;
}

export function PlayerInput({
  t,
  players,
  showBounty,
  onUpdate,
}: PlayerInputProps) {
  const [mode, setMode] = useState<"table" | "csv">("table");

  const toggleMode = () => {
    setMode((prev) => (prev === "table" ? "csv" : "table"));
  };

  return (
    <div class="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div class="card-label" style={{ marginBottom: 0 }}>
          {t("players")}
        </div>
        <button class="btn-outline" onClick={toggleMode}>
          {mode === "table" ? t("switchCsv") : t("switchTable")}
        </button>
      </div>

      {mode === "table" ? (
        <PlayerTable
          t={t}
          players={players}
          showBounty={showBounty}
          onUpdate={onUpdate}
        />
      ) : (
        <CsvInput
          t={t}
          showBounty={showBounty}
          players={players}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
