import { useMemo, useState } from "preact/hooks";
import { useI18n } from "./hooks/useI18n";
import { useEngine } from "./hooks/useEngine";
import { Header } from "./components/Header";
import { TournamentTypeSelector } from "./components/TournamentTypeSelector";
import { PlayerInput } from "./components/PlayerInput";
import { PayoutStructure } from "./components/PayoutStructure";
import { PkoSettings } from "./components/PkoSettings";
import { BreakevenInput } from "./components/BreakevenInput";
import { CalculateButton } from "./components/CalculateButton";
import { ResultsTable } from "./components/ResultsTable";
import { MetadataBar } from "./components/MetadataBar";
import { EquityChart } from "./components/EquityChart";
import { PressureCurveChart } from "./components/PressureCurveChart";
import { MttSimpleMode } from "./components/MttSimpleMode";
import type { MttSimpleState } from "./components/MttSimpleMode";
import { generateMttPayouts, MTT_PAYOUT_PRESETS } from "./utils/mttPayouts";
import { estimateCalcTime } from "./utils/estimateTime";
import type {
  PlayerInput as PlayerInputType,
  PrizeStructure,
  PkoConfig,
  BreakevenFormState,
  CalculationInput,
} from "./types";

type InputMode = "advanced" | "mttSimple";

const DEFAULT_PLAYERS: PlayerInputType[] = [
  { name: "Player 1", stack: 5000, bounty: 10 },
  { name: "Player 2", stack: 3000, bounty: 10 },
  { name: "Player 3", stack: 2000, bounty: 10 },
];

const DEFAULT_PRIZE_STRUCTURE: PrizeStructure = {
  type: "percentage",
  payouts: [50, 30, 20],
  totalPrizePool: 1000,
};

const DEFAULT_PKO_CONFIG: PkoConfig = {
  inheritanceRate: 0.5,
};

const DEFAULT_BREAKEVEN: BreakevenFormState = {
  entryFee: 110,
  rakePct: 10,
  startingChips: 10000,
};

const DEFAULT_MTT_SIMPLE: MttSimpleState = {
  entryFee: 110,
  rakePct: 10,
  startingChips: 10000,
  totalEntries: 100,
  remainingPlayers: 20,
  myStack: 50000,
  payoutPresetKey: "top15",
};

export function App() {
  const { t, lang, setLang } = useI18n();
  const { calculate, isLoading, error, result } = useEngine();

  const [inputMode, setInputMode] = useState<InputMode>("advanced");
  const [tournamentType, setTournamentType] = useState<
    "standard" | "bounty" | "pko"
  >("standard");
  const [players, setPlayers] = useState<PlayerInputType[]>(DEFAULT_PLAYERS);
  const [prizeStructure, setPrizeStructure] = useState<PrizeStructure>(
    DEFAULT_PRIZE_STRUCTURE,
  );
  const [pkoConfig, setPkoConfig] = useState<PkoConfig>(DEFAULT_PKO_CONFIG);
  const [breakeven, setBreakeven] =
    useState<BreakevenFormState>(DEFAULT_BREAKEVEN);
  const [breakevenEnabled, setBreakevenEnabled] = useState(false);

  const [mttSimple, setMttSimple] =
    useState<MttSimpleState>(DEFAULT_MTT_SIMPLE);

  const showBounty = tournamentType === "bounty" || tournamentType === "pko";

  const handleCalculate = () => {
    if (inputMode === "mttSimple") {
      handleMttSimpleCalculate();
    } else {
      handleAdvancedCalculate();
    }
  };

  const handleAdvancedCalculate = () => {
    const input: CalculationInput = {
      tournamentType,
      players,
      prizeStructure,
    };
    if (tournamentType === "pko") {
      input.pkoConfig = pkoConfig;
    }
    if (breakevenEnabled) {
      const rake = breakeven.entryFee * (breakeven.rakePct / 100);
      const buyIn = breakeven.entryFee - rake;
      input.breakeven = {
        entryFee: breakeven.entryFee,
        buyIn,
        rake,
        startingChips: breakeven.startingChips,
      };
    }
    calculate(input);
  };

  const handleMttSimpleCalculate = () => {
    const s = mttSimple;
    const rake = s.entryFee * (s.rakePct / 100);
    const buyIn = s.entryFee - rake;
    const prizePool = buyIn * s.totalEntries;
    const totalChips = s.startingChips * s.totalEntries;

    const selectedPreset = MTT_PAYOUT_PRESETS.find(
      (p) => p.key === s.payoutPresetKey,
    );
    const topPercent = selectedPreset?.topPercent ?? 15;
    const payouts = generateMttPayouts(s.totalEntries, topPercent);

    // Build players: "You" + equal-stack opponents
    const opponentCount = s.remainingPlayers - 1;
    const opponentStack =
      opponentCount > 0 ? (totalChips - s.myStack) / opponentCount : 0;

    const mttPlayers: PlayerInputType[] = [{ name: "You", stack: s.myStack }];
    for (let i = 0; i < opponentCount; i++) {
      mttPlayers.push({
        name: `Opponent ${i + 1}`,
        stack: opponentStack,
      });
    }

    const input: CalculationInput = {
      tournamentType: "standard",
      players: mttPlayers,
      prizeStructure: {
        type: "percentage",
        payouts,
        totalPrizePool: prizePool,
      },
      breakeven: {
        entryFee: s.entryFee,
        buyIn,
        rake,
        startingChips: s.startingChips,
      },
    };

    calculate(input);
  };

  const breakevenEntryFee = result?.players[0]?.breakeven?.entryFee;
  const isSimple = inputMode === "mttSimple";

  const estimatedPlayerCount =
    inputMode === "mttSimple" ? mttSimple.remainingPlayers : players.length;

  const estimateHint = useMemo(() => {
    const est = estimateCalcTime(estimatedPlayerCount);
    const keyMap: Record<string, Record<string, string>> = {
      exact: { instant: "estimateExactInstant" },
      approximate: {
        fast: "estimateApproxFast",
        moderate: "estimateApproxModerate",
        slow: "estimateApproxSlow",
      },
    };
    const i18nKey = keyMap[est.algorithm]?.[est.timeKey];
    return i18nKey ? t(i18nKey) : undefined;
  }, [estimatedPlayerCount, t]);

  return (
    <div class="container">
      <Header t={t} lang={lang} setLang={setLang} />

      {/* Input Mode Toggle */}
      <div class="card">
        <div class="card-label">{t("inputMode")}</div>
        <div class="pill-group">
          <label class={inputMode === "advanced" ? "active" : ""}>
            <input
              type="radio"
              name="inputMode"
              value="advanced"
              checked={inputMode === "advanced"}
              onChange={() => setInputMode("advanced")}
            />
            {t("modeAdvanced")}
          </label>
          <label class={inputMode === "mttSimple" ? "active" : ""}>
            <input
              type="radio"
              name="inputMode"
              value="mttSimple"
              checked={inputMode === "mttSimple"}
              onChange={() => setInputMode("mttSimple")}
            />
            {t("modeMttSimple")}
          </label>
        </div>
      </div>

      {isSimple ? (
        <MttSimpleMode t={t} state={mttSimple} onUpdate={setMttSimple} />
      ) : (
        <>
          <TournamentTypeSelector
            t={t}
            value={tournamentType}
            onChange={setTournamentType}
          />

          <PlayerInput
            t={t}
            players={players}
            showBounty={showBounty}
            onUpdate={setPlayers}
          />

          <PayoutStructure
            t={t}
            prizeStructure={prizeStructure}
            onUpdate={setPrizeStructure}
          />

          {tournamentType === "pko" && (
            <PkoSettings t={t} config={pkoConfig} onUpdate={setPkoConfig} />
          )}

          <BreakevenInput
            t={t}
            breakeven={breakeven}
            onUpdate={setBreakeven}
            open={breakevenEnabled}
            onToggle={setBreakevenEnabled}
          />
        </>
      )}

      <CalculateButton
        t={t}
        isLoading={isLoading}
        onClick={handleCalculate}
        estimateHint={estimateHint}
      />

      {error && <div class="error-message">{error}</div>}

      {result && (
        <div class="results-section">
          <div class="results-divider">
            <h2>{t("results")}</h2>
            <div class="line"></div>
          </div>

          <ResultsTable
            t={t}
            players={result.players}
            showBounty={!isSimple && showBounty}
            showBreakeven={!!result.players[0]?.breakeven}
          />

          <EquityChart
            t={t}
            players={result.players}
            showBounty={!isSimple && showBounty}
            entryFee={breakevenEntryFee}
          />

          {result.pressureCurve.length > 0 && (
            <PressureCurveChart
              t={t}
              curve={result.pressureCurve}
              entryFee={breakevenEntryFee}
            />
          )}

          <MetadataBar t={t} metadata={result.metadata} />
        </div>
      )}
    </div>
  );
}
