import type { PlayerInput } from "../types";

interface PlayerTableProps {
  t: (key: string) => string;
  players: PlayerInput[];
  showBounty: boolean;
  onUpdate: (players: PlayerInput[]) => void;
}

export function PlayerTable({
  t,
  players,
  showBounty,
  onUpdate,
}: PlayerTableProps) {
  const updatePlayer = (
    index: number,
    field: keyof PlayerInput,
    value: string | number,
  ) => {
    const updated = players.map((p, i) => {
      if (i !== index) return p;
      return { ...p, [field]: value };
    });
    onUpdate(updated);
  };

  const addPlayer = () => {
    onUpdate([
      ...players,
      {
        name: `Player ${players.length + 1}`,
        stack: 1000,
        bounty: 10,
      },
    ]);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 2) return;
    onUpdate(players.filter((_, i) => i !== index));
  };

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>{t("name")}</th>
            <th>{t("stack")}</th>
            {showBounty && <th>{t("bountyCol")}</th>}
            <th style={{ width: "40px" }}></th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, i) => (
            <tr key={i}>
              <td>
                <input
                  type="text"
                  value={player.name}
                  style={{ width: "120px" }}
                  onInput={(e) =>
                    updatePlayer(
                      i,
                      "name",
                      (e.target as HTMLInputElement).value,
                    )}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={player.stack}
                  min={1}
                  onInput={(e) =>
                    updatePlayer(
                      i,
                      "stack",
                      parseFloat((e.target as HTMLInputElement).value) || 0,
                    )}
                />
              </td>
              {showBounty && (
                <td>
                  <input
                    type="number"
                    value={player.bounty ?? 10}
                    min={0}
                    style={{ width: "100px" }}
                    onInput={(e) =>
                      updatePlayer(
                        i,
                        "bounty",
                        parseFloat((e.target as HTMLInputElement).value) || 0,
                      )}
                  />
                </td>
              )}
              <td>
                <button
                  class="btn-remove"
                  onClick={() => removePlayer(i)}
                  disabled={players.length <= 2}
                >
                  &times;
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: "10px" }}>
        <button class="btn-sm" onClick={addPlayer}>
          {t("addPlayer")}
        </button>
      </div>
    </div>
  );
}
