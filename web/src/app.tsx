import { useState } from "preact/hooks";
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
import type {
  PlayerInput as PlayerInputType,
  PrizeStructure,
  PkoConfig,
  BreakevenFormState,
  CalculationInput,
} from "./types";

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

export function App() {
  const { t, lang, setLang } = useI18n();
  const { calculate, isLoading, error, result } = useEngine();

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

  const showBounty = tournamentType === "bounty" || tournamentType === "pko";

  const handleCalculate = () => {
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

  const breakevenEntryFee = result?.players[0]?.breakeven?.entryFee;

  return (
    <div class="container">
      <Header t={t} lang={lang} setLang={setLang} />

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

      <CalculateButton t={t} isLoading={isLoading} onClick={handleCalculate} />

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
            showBounty={showBounty}
            showBreakeven={!!result.players[0]?.breakeven}
          />

          <EquityChart
            t={t}
            players={result.players}
            showBounty={showBounty}
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
