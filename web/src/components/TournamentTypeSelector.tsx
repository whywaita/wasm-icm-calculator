type TournamentType = "standard" | "bounty" | "pko";

interface TournamentTypeSelectorProps {
  t: (key: string) => string;
  value: TournamentType;
  onChange: (type: TournamentType) => void;
}

const TYPES: TournamentType[] = ["standard", "bounty", "pko"];

export function TournamentTypeSelector({
  t,
  value,
  onChange,
}: TournamentTypeSelectorProps) {
  return (
    <div class="card">
      <div class="card-label">{t("tournamentType")}</div>
      <div class="pill-group">
        {TYPES.map((type) => (
          <label key={type} class={value === type ? "active" : ""}>
            <input
              type="radio"
              name="tournamentType"
              value={type}
              checked={value === type}
              onChange={() => onChange(type)}
            />
            {t(type)}
          </label>
        ))}
      </div>
    </div>
  );
}
