import { useMemo, useState } from "preact/hooks";
import { ordinal } from "./PayoutStructure";
import { generateMttPayouts, MTT_PAYOUT_PRESETS } from "../utils/mttPayouts";

export interface MttSimpleState {
  entryFee: number;
  rakePct: number;
  payoutRate: number;
  startingChips: number;
  totalEntries: number;
  remainingPlayers: number;
  myStack: number;
  payoutPresetKey: string;
}

interface MttSimpleModeProps {
  t: (key: string) => string;
  state: MttSimpleState;
  onUpdate: (s: MttSimpleState) => void;
}

export function MttSimpleMode({ t, state, onUpdate }: MttSimpleModeProps) {
  const rake = state.entryFee * (state.rakePct / 100);
  const buyIn = state.entryFee - rake;
  const prizePool = buyIn * state.totalEntries * (state.payoutRate / 100);
  const totalChips = state.startingChips * state.totalEntries;
  const avgStack = state.remainingPlayers > 1
    ? (totalChips - state.myStack) / (state.remainingPlayers - 1)
    : 0;

  const selectedPreset = MTT_PAYOUT_PRESETS.find(
    (p) => p.key === state.payoutPresetKey,
  );
  const topPercent = selectedPreset?.topPercent ?? 15;

  const payouts = useMemo(
    () => generateMttPayouts(state.totalEntries, topPercent),
    [state.totalEntries, topPercent],
  );

  const paidPositions = payouts.length;

  const [payoutOpen, setPayoutOpen] = useState(false);

  const set = (partial: Partial<MttSimpleState>) =>
    onUpdate({ ...state, ...partial });

  const num = (e: Event) =>
    parseFloat((e.target as HTMLInputElement).value) || 0;
  const int = (e: Event) =>
    parseInt((e.target as HTMLInputElement).value, 10) || 0;

  return (
    <>
      {/* Tournament Info */}
      <div class="card">
        <div class="card-label">{t("mttTournamentInfo")}</div>

        <div class="row" style={{ gap: "20px", marginBottom: "12px" }}>
          <div class="field">
            <span class="field-label">{t("entryFee")}</span>
            <input
              type="number"
              value={state.entryFee}
              min={0}
              step={1}
              onInput={(e) => set({ entryFee: num(e) })}
            />
          </div>
          <div class="field">
            <span class="field-label">{t("rakePct")}</span>
            <input
              type="number"
              value={state.rakePct}
              min={0}
              max={100}
              step={0.1}
              style={{ width: "80px" }}
              onInput={(e) => set({ rakePct: num(e) })}
            />
          </div>
          <div class="field">
            <span class="field-label">{t("mttPayoutRate")}</span>
            <input
              type="number"
              value={state.payoutRate}
              min={1}
              max={100}
              step={0.1}
              style={{ width: "80px" }}
              onInput={(e) => set({ payoutRate: Math.min(100, Math.max(1, num(e))) })}
            />
          </div>
        </div>

        <div class="be-display" style={{ marginBottom: "12px" }}>
          <div class="be-item">
            {t("buyIn")} <span class="be-val">{buyIn.toFixed(2)}</span>
          </div>
          <div class="be-item">
            {t("rake")} <span class="be-val">{rake.toFixed(2)}</span>
          </div>
          <div class="be-item">
            {t("mttPrizePool")}{" "}
            <span class="be-val">{prizePool.toFixed(0)}</span>
          </div>
        </div>

        <div class="row" style={{ gap: "20px", marginBottom: "12px" }}>
          <div class="field">
            <span class="field-label">{t("mttStartingChips")}</span>
            <input
              type="number"
              value={state.startingChips}
              min={1}
              step={1}
              onInput={(e) => set({ startingChips: int(e) })}
            />
          </div>
          <div class="field">
            <span class="field-label">{t("mttTotalEntries")}</span>
            <input
              type="number"
              value={state.totalEntries}
              min={2}
              step={1}
              onInput={(e) => set({ totalEntries: Math.max(2, int(e)) })}
            />
          </div>
        </div>
      </div>

      {/* Current Situation */}
      <div class="card">
        <div class="card-label">{t("mttCurrentSituation")}</div>

        <div class="row" style={{ gap: "20px", marginBottom: "12px" }}>
          <div class="field">
            <span class="field-label">{t("mttRemainingPlayers")}</span>
            <input
              type="number"
              value={state.remainingPlayers}
              min={2}
              max={state.totalEntries}
              step={1}
              onInput={(e) =>
                set({
                  remainingPlayers: Math.max(
                    2,
                    Math.min(state.totalEntries, int(e)),
                  ),
                })}
            />
          </div>
          <div class="field">
            <span class="field-label">{t("mttMyStack")}</span>
            <input
              type="number"
              value={state.myStack}
              min={1}
              max={totalChips}
              step={1}
              onInput={(e) => set({ myStack: int(e) })}
            />
          </div>
        </div>

        <div class="be-display">
          <div class="be-item">
            {t("mttTotalChips")}{" "}
            <span class="be-val">{totalChips.toLocaleString()}</span>
          </div>
          <div class="be-item">
            {t("mttAvgStack")}{" "}
            <span class="be-val">{Math.round(avgStack).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payout Preset */}
      <div class="card">
        <div class="card-label">{t("mttPayoutPreset")}</div>

        <div class="pill-group" style={{ marginBottom: "16px" }}>
          {MTT_PAYOUT_PRESETS.map((preset) => (
            <label
              key={preset.key}
              class={state.payoutPresetKey === preset.key ? "active" : ""}
            >
              <input
                type="radio"
                name="mttPayoutPreset"
                value={preset.key}
                checked={state.payoutPresetKey === preset.key}
                onChange={() => set({ payoutPresetKey: preset.key })}
              />
              {t(`mttPreset_${preset.key}`)}
            </label>
          ))}
        </div>

        <div
          class={`collapse-trigger mtt-payout-summary${
            payoutOpen ? " open" : ""
          }`}
          onClick={() => setPayoutOpen((v) => !v)}
        >
          <div>
            <span class="field-label">{t("mttPaidPositions")}</span>
            <span class="be-val" style={{ marginLeft: "8px" }}>
              {paidPositions}
            </span>
            <span
              style={{
                marginLeft: "16px",
                fontSize: "0.88rem",
                color: "var(--text-tertiary)",
              }}
            >
              {t("mttPayoutPreview")} {payouts
                .slice(0, 3)
                .map((p) => `${p}%`)
                .join(" / ")} {payouts.length > 3 ? "..." : ""}
            </span>
          </div>
          <span class="collapse-chevron">&#9654;</span>
        </div>
        <div class={`collapse-body${payoutOpen ? " open" : ""}`}>
          <table class="payout-detail-table">
            <thead>
              <tr>
                <th>{t("position")}</th>
                <th>{t("percentage")}</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p, i) => (
                <tr key={i}>
                  <td>{ordinal(i + 1)}</td>
                  <td>{p}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
