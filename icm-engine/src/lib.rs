use wasm_bindgen::prelude::*;

pub mod bounty;
pub mod breakeven;
pub mod icm_exact;
pub mod icm_monte_carlo;
pub mod pko;
pub mod pressure;
pub mod types;
pub mod validation;

use types::{CalculationInput, CalculationResult, ErrorResponse, ResultMetadata, TournamentType};

const EXACT_PLAYER_THRESHOLD: usize = 20;
const DEFAULT_MC_ITERATIONS: u32 = 100_000;

#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn calculate(input_json: &str) -> Result<String, JsValue> {
    let input: CalculationInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("JSON parse error: {}", e)))?;

    if let Err(errors) = validation::validate(&input) {
        let error_response = ErrorResponse {
            error: true,
            validation_errors: errors,
        };
        return Ok(serde_json::to_string(&error_response).unwrap());
    }

    let result = compute(&input);
    Ok(serde_json::to_string(&result).unwrap())
}

#[wasm_bindgen]
pub fn get_engine_info() -> String {
    serde_json::to_string(&serde_json::json!({
        "version": "0.1.0",
        "algorithms": ["exact", "approximate"],
        "maxPlayers": 50
    }))
    .unwrap()
}

fn compute(input: &CalculationInput) -> CalculationResult {
    let start = js_sys::Date::now();

    let stacks = input.players.iter().map(|p| p.stack).collect::<Vec<_>>();
    let total_chips: f64 = stacks.iter().sum();
    let payouts = input.resolved_payouts();
    let n = stacks.len();

    let algorithm = if n <= EXACT_PLAYER_THRESHOLD {
        "exact"
    } else {
        "approximate"
    };

    let icm_equities = if n <= EXACT_PLAYER_THRESHOLD {
        icm_exact::compute_equity_exact(&stacks, &payouts)
    } else {
        icm_monte_carlo::compute_equity_monte_carlo(&stacks, &payouts, DEFAULT_MC_ITERATIONS)
    };

    let bounty_equities = match input.tournament_type {
        TournamentType::Bounty => {
            let bounties: Vec<f64> = input
                .players
                .iter()
                .map(|p| p.bounty.unwrap_or(0.0))
                .collect();
            Some(bounty::compute_bounty_equity(&stacks, &bounties))
        }
        TournamentType::Pko => {
            let bounties: Vec<f64> = input
                .players
                .iter()
                .map(|p| p.bounty.unwrap_or(0.0))
                .collect();
            let rate = input
                .pko_config
                .as_ref()
                .map(|c| c.inheritance_rate)
                .unwrap_or(0.5);
            Some(pko::compute_pko_bounty_equity(&stacks, &bounties, rate))
        }
        TournamentType::Standard => None,
    };

    let total_prize_pool: f64 = payouts.iter().sum();

    let players: Vec<types::PlayerResult> = (0..n)
        .map(|i| {
            let icm_equity = icm_equities[i];
            let bounty_eq = bounty_equities.as_ref().map(|b| b[i]);
            let total_eq = bounty_eq.map(|b| icm_equity + b);

            let breakeven_result = input.breakeven.as_ref().map(|be| {
                let icm_dollar = total_eq.unwrap_or(icm_equity);
                breakeven::compute_breakeven(icm_dollar, be)
            });

            types::PlayerResult {
                name: input.players[i].name.clone(),
                stack: stacks[i],
                stack_percentage: (stacks[i] / total_chips) * 100.0,
                icm_equity,
                icm_equity_percentage: (icm_equity / total_prize_pool) * 100.0,
                bounty_equity: bounty_eq,
                total_equity: total_eq,
                breakeven: breakeven_result,
            }
        })
        .collect();

    let pressure_curve = pressure::compute_pressure_curve(&stacks, &payouts, algorithm == "exact");

    let elapsed = js_sys::Date::now() - start;

    CalculationResult {
        players,
        pressure_curve,
        metadata: ResultMetadata {
            algorithm: algorithm.to_string(),
            player_count: n,
            calculation_time_ms: elapsed,
        },
    }
}
