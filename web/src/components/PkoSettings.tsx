import type { PkoConfig } from "../types";

interface PkoSettingsProps {
  t: (key: string) => string;
  config: PkoConfig;
  onUpdate: (config: PkoConfig) => void;
}

export function PkoSettings({ t, config, onUpdate }: PkoSettingsProps) {
  return (
    <div class="card">
      <div class="card-label">{t("pkoSettings")}</div>
      <div class="field">
        <span class="field-label">{t("inheritance")}</span>
        <input
          type="number"
          value={config.inheritanceRate}
          min={0.01}
          max={1}
          step={0.01}
          onInput={(e) =>
            onUpdate({
              inheritanceRate:
                parseFloat((e.target as HTMLInputElement).value) || 0.5,
            })}
        />
        <span
          style={{ fontSize: "0.92rem", color: "var(--text-tertiary)" }}
        >
          {t("inheritanceHint")}
        </span>
      </div>
    </div>
  );
}
