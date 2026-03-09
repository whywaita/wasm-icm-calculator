// === Input Types ===

export interface PlayerInput {
  name: string;
  stack: number;
  bounty?: number;
}

export interface PrizeStructure {
  type: "percentage" | "absolute";
  payouts: number[];
  totalPrizePool?: number;
}

export interface PkoConfig {
  inheritanceRate: number;
}

export interface BreakevenInput {
  entryFee: number;
  buyIn: number;
  rake: number;
  startingChips: number;
}

// UI-only breakeven state (with rakePct for the form)
export interface BreakevenFormState {
  entryFee: number;
  rakePct: number;
  startingChips: number;
}

export interface CalculationInput {
  tournamentType: "standard" | "bounty" | "pko";
  players: PlayerInput[];
  prizeStructure: PrizeStructure;
  pkoConfig?: PkoConfig;
  breakeven?: BreakevenInput;
}

// === Result Types ===

export interface BreakevenResult {
  icmDollar: number;
  entryFee: number;
  buyIn: number;
  profitLoss: number;
  isAboveBreakeven: boolean;
  startingChips: number;
}

export interface PlayerResult {
  name?: string;
  stack: number;
  stackPercentage: number;
  icmEquity: number;
  icmEquityPercentage: number;
  bountyEquity?: number;
  totalEquity?: number;
  breakeven?: BreakevenResult;
}

export interface PressureCurvePoint {
  stack: number;
  icmEquity: number;
}

export interface ResultMetadata {
  algorithm: string;
  playerCount: number;
  calculationTimeMs: number;
}

export interface CalculationResult {
  players: PlayerResult[];
  pressureCurve: PressureCurvePoint[];
  metadata: ResultMetadata;
}

// === Worker Message Types ===

export interface WorkerRequest {
  type: "calculate";
  data: CalculationInput;
}

export interface WorkerSuccessResponse {
  type: "result";
  data: CalculationResult;
}

export interface WorkerErrorResponse {
  type: "error";
  error: string;
}

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;

// === Validation ===

export interface ValidationError {
  field: string;
  message: string;
}
