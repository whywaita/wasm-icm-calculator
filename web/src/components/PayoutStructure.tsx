import type { PrizeStructure } from "../types";

interface PayoutStructureProps {
  t: (key: string) => string;
  prizeStructure: PrizeStructure;
  onUpdate: (ps: PrizeStructure) => void;
}

const PRESETS: Record<string, number[]> = {
  "50/30/20": [50, 30, 20],
  "40/30/20/10": [40, 30, 20, 10],
  "65/25/10": [65, 25, 10],
  "standard-mtt-9": [30, 20, 14, 10.5, 8, 6.5, 5, 3.5, 2.5],
};

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function PayoutStructure({
  t,
  prizeStructure,
  onUpdate,
}: PayoutStructureProps) {
  const isPct = prizeStructure.type === "percentage";
  const total = prizeStructure.payouts.reduce((sum, v) => sum + v, 0);

  const updatePrize = (index: number, value: number) => {
    const payouts = prizeStructure.payouts.map((p, i) =>
      i === index ? value : p
    );
    onUpdate({ ...prizeStructure, payouts });
  };

  const addPosition = () => {
    onUpdate({ ...prizeStructure, payouts: [...prizeStructure.payouts, 0] });
  };

  const removePosition = (index: number) => {
    if (prizeStructure.payouts.length <= 1) return;
    onUpdate({
      ...prizeStructure,
      payouts: prizeStructure.payouts.filter((_, i) => i !== index),
    });
  };

  const applyPreset = (key: string) => {
    const values = PRESETS[key];
    if (!values) return;
    onUpdate({ ...prizeStructure, type: "percentage", payouts: [...values] });
  };

  const totalClass = isPct
    ? Math.abs(total - 100) < 0.1
      ? "running-total valid"
      : "running-total invalid"
    : "running-total";

  const totalText = isPct
    ? `${t("totalLabel")} ${total.toFixed(1)}%`
    : `${t("totalLabel")} ${total.toFixed(2)}`;

  return (
    <div class="card">
      <div class="card-label">{t("payouts")}</div>

      <div class="row" style={{ marginBottom: "12px" }}>
        <div class="pill-group">
          <label class={isPct ? "active" : ""}>
            <input
              type="radio"
              name="payoutType"
              value="percentage"
              checked={isPct}
              onChange={() =>
                onUpdate({ ...prizeStructure, type: "percentage" })}
            />
            {t("percentage")}
          </label>
          <label class={!isPct ? "active" : ""}>
            <input
              type="radio"
              name="payoutType"
              value="absolute"
              checked={!isPct}
              onChange={() => onUpdate({ ...prizeStructure, type: "absolute" })}
            />
            {t("absolute")}
          </label>
        </div>
      </div>

      <div class="row" style={{ marginBottom: "12px" }}>
        <div class="field">
          <span class="field-label">{t("preset")}</span>
          <select
            onChange={(e) => applyPreset((e.target as HTMLSelectElement).value)}
          >
            <option value="">{t("presetSelect")}</option>
            <option value="50/30/20">{t("preset5030")}</option>
            <option value="40/30/20/10">{t("preset403020")}</option>
            <option value="65/25/10">{t("preset652510")}</option>
            <option value="standard-mtt-9">{t("presetMtt9")}</option>
          </select>
        </div>
      </div>

      {isPct && (
        <div class="field" style={{ marginBottom: "12px" }}>
          <span class="field-label">{t("prizePool")}</span>
          <input
            type="number"
            value={prizeStructure.totalPrizePool ?? 1000}
            min={0}
            step={1}
            onInput={(e) =>
              onUpdate({
                ...prizeStructure,
                totalPrizePool:
                  parseFloat((e.target as HTMLInputElement).value) || 0,
              })}
          />
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>{t("position")}</th>
            <th>{t("amount")}</th>
            <th style={{ width: "40px" }}></th>
          </tr>
        </thead>
        <tbody>
          {prizeStructure.payouts.map((prize, i) => (
            <tr key={i}>
              <td
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                }}
              >
                {ordinal(i + 1)}
              </td>
              <td>
                <input
                  type="number"
                  value={prize}
                  min={0}
                  step={0.01}
                  onInput={(e) =>
                    updatePrize(
                      i,
                      parseFloat((e.target as HTMLInputElement).value) || 0,
                    )}
                />
              </td>
              <td>
                <button
                  class="btn-remove"
                  onClick={() => removePosition(i)}
                  disabled={prizeStructure.payouts.length <= 1}
                >
                  &times;
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div class="row" style={{ marginTop: "10px" }}>
        <button class="btn-sm" onClick={addPosition}>
          {t("addPosition")}
        </button>
        <span class={totalClass}>{totalText}</span>
      </div>
    </div>
  );
}
