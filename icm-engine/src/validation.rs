use crate::types::{CalculationInput, PayoutType, TournamentType, ValidationError};

pub fn validate(input: &CalculationInput) -> Result<(), Vec<ValidationError>> {
    let mut errors = Vec::new();

    let n = input.players.len();
    if n < 2 {
        errors.push(ValidationError {
            field: "players".to_string(),
            message: "At least 2 players are required".to_string(),
        });
    }

    for (i, player) in input.players.iter().enumerate() {
        if player.stack <= 0.0 {
            errors.push(ValidationError {
                field: format!("players[{}].stack", i),
                message: "Stack must be positive".to_string(),
            });
        }

        let needs_bounty = input.tournament_type == TournamentType::Bounty
            || input.tournament_type == TournamentType::Pko;
        if needs_bounty {
            match player.bounty {
                None => {
                    errors.push(ValidationError {
                        field: format!("players[{}].bounty", i),
                        message: "Bounty is required for bounty/pko tournaments".to_string(),
                    });
                }
                Some(b) if b < 0.0 => {
                    errors.push(ValidationError {
                        field: format!("players[{}].bounty", i),
                        message: "Bounty must be non-negative".to_string(),
                    });
                }
                _ => {}
            }
        }
    }

    let payouts = &input.prize_structure.payouts;
    if payouts.is_empty() {
        errors.push(ValidationError {
            field: "prizeStructure.payouts".to_string(),
            message: "At least 1 payout position is required".to_string(),
        });
    }
    // payouts.len() > n is allowed: extra positions are treated as already paid out
    // (e.g., 3 remaining players with a 5-place payout structure means 4th/5th are eliminated)

    let payout_sum: f64 = payouts.iter().sum();
    match input.prize_structure.payout_type {
        PayoutType::Percentage => {
            if let Some(pool) = input.prize_structure.total_prize_pool {
                if pool <= 0.0 {
                    errors.push(ValidationError {
                        field: "prizeStructure.totalPrizePool".to_string(),
                        message: "Total prize pool is required for percentage payouts".to_string(),
                    });
                }
            } else {
                errors.push(ValidationError {
                    field: "prizeStructure.totalPrizePool".to_string(),
                    message: "Total prize pool is required for percentage payouts".to_string(),
                });
            }

            if (payout_sum - 100.0).abs() > 0.01 {
                errors.push(ValidationError {
                    field: "prizeStructure.payouts".to_string(),
                    message: "Payout sum must equal 100% (percentage)".to_string(),
                });
            }
        }
        PayoutType::Absolute => {
            if let Some(pool) = input.prize_structure.total_prize_pool {
                if payout_sum > pool + f64::EPSILON {
                    errors.push(ValidationError {
                        field: "prizeStructure.payouts".to_string(),
                        message: "Payout sum must be within prize pool (absolute)".to_string(),
                    });
                }
            }
        }
    }

    if input.tournament_type == TournamentType::Pko {
        if let Some(ref config) = input.pko_config {
            if config.inheritance_rate <= 0.0 || config.inheritance_rate > 1.0 {
                errors.push(ValidationError {
                    field: "pkoConfig.inheritanceRate".to_string(),
                    message: "Inheritance rate must be between 0 (exclusive) and 1 (inclusive)"
                        .to_string(),
                });
            }
        }
    }

    if let Some(ref be) = input.breakeven {
        if be.entry_fee <= 0.0 {
            errors.push(ValidationError {
                field: "breakeven.entryFee".to_string(),
                message: "Entry fee must be positive".to_string(),
            });
        }
        if be.rake < 0.0 || be.rake >= be.entry_fee {
            errors.push(ValidationError {
                field: "breakeven.rake".to_string(),
                message: "Rake must be non-negative and less than entry fee".to_string(),
            });
        }
        if (be.buy_in - (be.entry_fee - be.rake)).abs() > 0.01 {
            errors.push(ValidationError {
                field: "breakeven.buyIn".to_string(),
                message: "Buy-in must equal entry fee minus rake".to_string(),
            });
        }
        if be.starting_chips <= 0.0 {
            errors.push(ValidationError {
                field: "breakeven.startingChips".to_string(),
                message: "Starting chips must be positive".to_string(),
            });
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{PlayerInput, PrizeStructure};

    fn make_input(player_count: usize) -> CalculationInput {
        let players: Vec<PlayerInput> = (0..player_count)
            .map(|_| PlayerInput {
                name: None,
                stack: 1000.0,
                bounty: None,
            })
            .collect();
        let payouts: Vec<f64> = {
            let paid = player_count.min(10);
            let pct = 100.0 / paid as f64;
            vec![pct; paid]
        };
        CalculationInput {
            tournament_type: TournamentType::Standard,
            players,
            prize_structure: PrizeStructure {
                payout_type: PayoutType::Percentage,
                payouts,
                total_prize_pool: Some(10000.0),
            },
            pko_config: None,
            breakeven: None,
        }
    }

    #[test]
    fn test_50_players_valid() {
        let input = make_input(50);
        assert!(validate(&input).is_ok());
    }

    #[test]
    fn test_51_players_valid() {
        let input = make_input(51);
        assert!(validate(&input).is_ok());
    }

    #[test]
    fn test_100_players_valid() {
        let input = make_input(100);
        assert!(validate(&input).is_ok());
    }

    #[test]
    fn test_1_player_invalid() {
        let input = make_input(1);
        let err = validate(&input).unwrap_err();
        assert!(err.iter().any(|e| e.field == "players"));
    }
}
