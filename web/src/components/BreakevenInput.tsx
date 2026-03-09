import { useMemo } from "preact/hooks";
import type { BreakevenFormState } from "../types";

interface BreakevenInputProps {
  t: (key: string) => string;
  breakeven: BreakevenFormState;
  onUpdate: (b: BreakevenFormState) => void;
  open: boolean;
  onToggle: (open: boolean) => void;
}

export function BreakevenInput({
  t,
  breakeven,
  onUpdate,
  open,
  onToggle,
}: BreakevenInputProps) {
  const split = useMemo(() => {
    const rake = breakeven.entryFee * (breakeven.rakePct / 100);
    const buyIn = breakeven.entryFee - rake;
    return { buyIn, rake };
  }, [breakeven.entryFee, breakeven.rakePct]);

  return (
    <div class="card">
      <div
        class={`collapse-trigger ${open ? "open" : ""}`}
        onClick={() => onToggle(!open)}
      >
        <div class="collapse-chevron">&#9654;</div>
        <div class="card-label" style={{ marginBottom: 0 }}>
          {t("breakeven")}
        </div>
        <span
          style={{
            fontSize: "0.82rem",
            color: "var(--text-tertiary)",
            fontWeight: 400,
          }}
        >
          {t("breakevenOptional")}
        </span>
      </div>
      <div class={`collapse-body ${open ? "open" : ""}`}>
        <div class="row" style={{ gap: "20px" }}>
          <div class="field">
            <span class="field-label">{t("entryFee")}</span>
            <input
              type="number"
              value={breakeven.entryFee}
              min={0}
              step={1}
              onInput={(e) =>
                onUpdate({
                  ...breakeven,
                  entryFee:
                    parseFloat((e.target as HTMLInputElement).value) || 0,
                })
              }
            />
          </div>
          <div class="field">
            <span class="field-label">{t("rakePct")}</span>
            <input
              type="number"
              value={breakeven.rakePct}
              min={0}
              max={100}
              step={0.1}
              style={{ width: "80px" }}
              onInput={(e) =>
                onUpdate({
                  ...breakeven,
                  rakePct:
                    parseFloat((e.target as HTMLInputElement).value) || 0,
                })
              }
            />
          </div>
        </div>
        <div class="be-display">
          <div class="be-item">
            {t("buyIn")} <span class="be-val">{split.buyIn.toFixed(2)}</span>
          </div>
          <div class="be-item">
            {t("rake")} <span class="be-val">{split.rake.toFixed(2)}</span>
          </div>
        </div>
        <div class="field">
          <span class="field-label">{t("startingChips")}</span>
          <input
            type="number"
            value={breakeven.startingChips}
            min={1}
            step={1}
            onInput={(e) =>
              onUpdate({
                ...breakeven,
                startingChips:
                  parseFloat((e.target as HTMLInputElement).value) || 10000,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
