use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalculationInput {
    pub tournament_type: String,
    pub players: Vec<PlayerInput>,
    pub prize_structure: PrizeStructure,
    pub pko_config: Option<PkoConfig>,
    pub breakeven: Option<BreakevenInput>,
}

impl CalculationInput {
    pub fn resolved_payouts(&self) -> Vec<f64> {
        match self.prize_structure.payout_type.as_str() {
            "percentage" => {
                let pool = self.prize_structure.total_prize_pool.unwrap_or(0.0);
                let sum: f64 = self.prize_structure.payouts.iter().sum();
                self.prize_structure
                    .payouts
                    .iter()
                    .map(|p| (p / sum) * pool)
                    .collect()
            }
            _ => self.prize_structure.payouts.clone(),
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayerInput {
    pub name: Option<String>,
    pub stack: f64,
    pub bounty: Option<f64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrizeStructure {
    #[serde(rename = "type")]
    pub payout_type: String,
    pub payouts: Vec<f64>,
    pub total_prize_pool: Option<f64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PkoConfig {
    pub inheritance_rate: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BreakevenInput {
    pub entry_fee: f64,
    pub buy_in: f64,
    pub rake: f64,
    pub starting_chips: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CalculationResult {
    pub players: Vec<PlayerResult>,
    pub pressure_curve: Vec<PressureCurvePoint>,
    pub metadata: ResultMetadata,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayerResult {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub stack: f64,
    pub stack_percentage: f64,
    pub icm_equity: f64,
    pub icm_equity_percentage: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bounty_equity: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_equity: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub breakeven: Option<BreakevenResult>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BreakevenResult {
    pub icm_dollar: f64,
    pub entry_fee: f64,
    pub buy_in: f64,
    pub profit_loss: f64,
    pub is_above_breakeven: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PressureCurvePoint {
    pub stack: f64,
    pub icm_equity: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResultMetadata {
    pub algorithm: String,
    pub player_count: usize,
    pub calculation_time_ms: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationError {
    pub field: String,
    pub message: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorResponse {
    pub error: bool,
    pub validation_errors: Vec<ValidationError>,
}
