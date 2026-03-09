use icm_engine::types::{
    BreakevenInput, CalculationInput, PayoutType, PkoConfig, PlayerInput, PrizeStructure,
    TournamentType,
};
use icm_engine::validation::validate;

/// Helper to create a valid standard tournament input.
fn valid_standard_input() -> CalculationInput {
    CalculationInput {
        tournament_type: TournamentType::Standard,
        players: vec![
            PlayerInput {
                name: Some("Alice".to_string()),
                stack: 5000.0,
                bounty: None,
            },
            PlayerInput {
                name: Some("Bob".to_string()),
                stack: 3000.0,
                bounty: None,
            },
        ],
        prize_structure: PrizeStructure {
            payout_type: PayoutType::Absolute,
            payouts: vec![60.0, 40.0],
            total_prize_pool: Some(100.0),
        },
        pko_config: None,
        breakeven: None,
    }
}

#[test]
fn valid_standard_input_passes() {
    let input = valid_standard_input();
    assert!(validate(&input).is_ok());
}

#[test]
fn valid_bounty_input_passes() {
    let input = CalculationInput {
        tournament_type: TournamentType::Bounty,
        players: vec![
            PlayerInput {
                name: None,
                stack: 5000.0,
                bounty: Some(10.0),
            },
            PlayerInput {
                name: None,
                stack: 3000.0,
                bounty: Some(10.0),
            },
        ],
        prize_structure: PrizeStructure {
            payout_type: PayoutType::Absolute,
            payouts: vec![60.0, 40.0],
            total_prize_pool: Some(100.0),
        },
        pko_config: None,
        breakeven: None,
    };
    assert!(validate(&input).is_ok());
}

#[test]
fn valid_pko_input_passes() {
    let input = CalculationInput {
        tournament_type: TournamentType::Pko,
        players: vec![
            PlayerInput {
                name: None,
                stack: 5000.0,
                bounty: Some(10.0),
            },
            PlayerInput {
                name: None,
                stack: 3000.0,
                bounty: Some(10.0),
            },
        ],
        prize_structure: PrizeStructure {
            payout_type: PayoutType::Absolute,
            payouts: vec![60.0, 40.0],
            total_prize_pool: Some(100.0),
        },
        pko_config: Some(PkoConfig {
            inheritance_rate: 0.5,
        }),
        breakeven: None,
    };
    assert!(validate(&input).is_ok());
}

#[test]
fn valid_percentage_payout_passes() {
    let input = CalculationInput {
        tournament_type: TournamentType::Standard,
        players: vec![
            PlayerInput {
                name: None,
                stack: 5000.0,
                bounty: None,
            },
            PlayerInput {
                name: None,
                stack: 3000.0,
                bounty: None,
            },
        ],
        prize_structure: PrizeStructure {
            payout_type: PayoutType::Percentage,
            payouts: vec![60.0, 40.0],
            total_prize_pool: Some(1000.0),
        },
        pko_config: None,
        breakeven: None,
    };
    assert!(validate(&input).is_ok());
}

#[test]
fn valid_breakeven_input_passes() {
    let input = CalculationInput {
        tournament_type: TournamentType::Standard,
        players: vec![
            PlayerInput {
                name: None,
                stack: 5000.0,
                bounty: None,
            },
            PlayerInput {
                name: None,
                stack: 3000.0,
                bounty: None,
            },
        ],
        prize_structure: PrizeStructure {
            payout_type: PayoutType::Absolute,
            payouts: vec![60.0, 40.0],
            total_prize_pool: Some(100.0),
        },
        pko_config: None,
        breakeven: Some(BreakevenInput {
            entry_fee: 110.0,
            buy_in: 100.0,
            rake: 10.0,
            starting_chips: 10000.0,
        }),
    };
    assert!(validate(&input).is_ok());
}

// --- Error cases ---

#[test]
fn error_fewer_than_2_players() {
    let mut input = valid_standard_input();
    input.players = vec![PlayerInput {
        name: None,
        stack: 5000.0,
        bounty: None,
    }];
    input.prize_structure.payouts = vec![100.0];
    let errors = validate(&input).unwrap_err();
    assert!(errors.iter().any(|e| e.field == "players"));
    assert!(errors
        .iter()
        .any(|e| e.message.contains("At least 2 players")));
}

#[test]
fn error_more_than_50_players() {
    let mut input = valid_standard_input();
    input.players = (0..51)
        .map(|_| PlayerInput {
            name: None,
            stack: 1000.0,
            bounty: None,
        })
        .collect();
    let errors = validate(&input).unwrap_err();
    assert!(errors.iter().any(|e| e.field == "players"));
    assert!(errors
        .iter()
        .any(|e| e.message.contains("Maximum 50 players")));
}

#[test]
fn error_zero_stack() {
    let mut input = valid_standard_input();
    input.players[0].stack = 0.0;
    let errors = validate(&input).unwrap_err();
    assert!(errors.iter().any(|e| e.field == "players[0].stack"));
    assert!(errors
        .iter()
        .any(|e| e.message.contains("Stack must be positive")));
}

#[test]
fn error_negative_stack() {
    let mut input = valid_standard_input();
    input.players[1].stack = -100.0;
    let errors = validate(&input).unwrap_err();
    assert!(errors.iter().any(|e| e.field == "players[1].stack"));
}

#[test]
fn error_bounty_tournament_missing_bounty() {
    let input = CalculationInput {
        tournament_type: TournamentType::Bounty,
        players: vec![
            PlayerInput {
                name: None,
                stack: 5000.0,
                bounty: None,
            },
            PlayerInput {
                name: None,
                stack: 3000.0,
                bounty: Some(10.0),
            },
        ],
        prize_structure: PrizeStructure {
            payout_type: PayoutType::Absolute,
            payouts: vec![60.0, 40.0],
            total_prize_pool: Some(100.0),
        },
        pko_config: None,
        breakeven: None,
    };
    let errors = validate(&input).unwrap_err();
    assert!(errors.iter().any(|e| e.field == "players[0].bounty"));
    assert!(errors
        .iter()
        .any(|e| e.message.contains("Bounty is required")));
}

#[test]
fn error_bounty_tournament_negative_bounty() {
    let input = CalculationInput {
        tournament_type: TournamentType::Bounty,
        players: vec![
            PlayerInput {
                name: None,
                stack: 5000.0,
                bounty: Some(-5.0),
            },
            PlayerInput {
                name: None,
                stack: 3000.0,
                bounty: Some(10.0),
            },
        ],
        prize_structure: PrizeStructure {
            payout_type: PayoutType::Absolute,
            payouts: vec![60.0, 40.0],
            total_prize_pool: Some(100.0),
        },
        pko_config: None,
        breakeven: None,
    };
    let errors = validate(&input).unwrap_err();
    assert!(errors.iter().any(|e| e.field == "players[0].bounty"));
    assert!(errors
        .iter()
        .any(|e| e.message.contains("Bounty must be non-negative")));
}

#[test]
fn error_empty_payouts() {
    let mut input = valid_standard_input();
    input.prize_structure.payouts = vec![];
    let errors = validate(&input).unwrap_err();
    assert!(errors.iter().any(|e| e.field == "prizeStructure.payouts"));
    assert!(errors
        .iter()
        .any(|e| e.message.contains("At least 1 payout")));
}

#[test]
fn error_payouts_exceed_player_count() {
    let mut input = valid_standard_input();
    // 2 players, 3 payout positions
    input.prize_structure.payouts = vec![50.0, 30.0, 20.0];
    let errors = validate(&input).unwrap_err();
    assert!(errors
        .iter()
        .any(|e| e.message.contains("cannot exceed player count")));
}

#[test]
fn error_percentage_payouts_without_prize_pool() {
    let mut input = valid_standard_input();
    input.prize_structure.payout_type = PayoutType::Percentage;
    input.prize_structure.payouts = vec![60.0, 40.0];
    input.prize_structure.total_prize_pool = None;
    let errors = validate(&input).unwrap_err();
    assert!(errors
        .iter()
        .any(|e| e.field == "prizeStructure.totalPrizePool"));
}

#[test]
fn error_percentage_payouts_zero_prize_pool() {
    let mut input = valid_standard_input();
    input.prize_structure.payout_type = PayoutType::Percentage;
    input.prize_structure.payouts = vec![60.0, 40.0];
    input.prize_structure.total_prize_pool = Some(0.0);
    let errors = validate(&input).unwrap_err();
    assert!(errors
        .iter()
        .any(|e| e.field == "prizeStructure.totalPrizePool"));
}

#[test]
fn error_percentage_payouts_not_summing_to_100() {
    let mut input = valid_standard_input();
    input.prize_structure.payout_type = PayoutType::Percentage;
    input.prize_structure.payouts = vec![50.0, 30.0]; // sums to 80
    input.prize_structure.total_prize_pool = Some(1000.0);
    let errors = validate(&input).unwrap_err();
    assert!(errors.iter().any(|e| e.message.contains("must equal 100%")));
}

#[test]
fn error_absolute_payouts_exceed_prize_pool() {
    let mut input = valid_standard_input();
    input.prize_structure.payout_type = PayoutType::Absolute;
    input.prize_structure.payouts = vec![800.0, 300.0]; // sums to 1100 > 1000
    input.prize_structure.total_prize_pool = Some(1000.0);
    let errors = validate(&input).unwrap_err();
    assert!(errors
        .iter()
        .any(|e| e.message.contains("within prize pool")));
}

#[test]
fn error_pko_invalid_inheritance_rate_zero() {
    let input = CalculationInput {
        tournament_type: TournamentType::Pko,
        players: vec![
            PlayerInput {
                name: None,
                stack: 5000.0,
                bounty: Some(10.0),
            },
            PlayerInput {
                name: None,
                stack: 3000.0,
                bounty: Some(10.0),
            },
        ],
        prize_structure: PrizeStructure {
            payout_type: PayoutType::Absolute,
            payouts: vec![60.0, 40.0],
            total_prize_pool: Some(100.0),
        },
        pko_config: Some(PkoConfig {
            inheritance_rate: 0.0,
        }),
        breakeven: None,
    };
    let errors = validate(&input).unwrap_err();
    assert!(errors
        .iter()
        .any(|e| e.field == "pkoConfig.inheritanceRate"));
}

#[test]
fn error_pko_invalid_inheritance_rate_above_1() {
    let input = CalculationInput {
        tournament_type: TournamentType::Pko,
        players: vec![
            PlayerInput {
                name: None,
                stack: 5000.0,
                bounty: Some(10.0),
            },
            PlayerInput {
                name: None,
                stack: 3000.0,
                bounty: Some(10.0),
            },
        ],
        prize_structure: PrizeStructure {
            payout_type: PayoutType::Absolute,
            payouts: vec![60.0, 40.0],
            total_prize_pool: Some(100.0),
        },
        pko_config: Some(PkoConfig {
            inheritance_rate: 1.5,
        }),
        breakeven: None,
    };
    let errors = validate(&input).unwrap_err();
    assert!(errors
        .iter()
        .any(|e| e.field == "pkoConfig.inheritanceRate"));
}

#[test]
fn error_breakeven_zero_entry_fee() {
    let mut input = valid_standard_input();
    input.breakeven = Some(BreakevenInput {
        entry_fee: 0.0,
        buy_in: 0.0,
        rake: 0.0,
        starting_chips: 10000.0,
    });
    let errors = validate(&input).unwrap_err();
    assert!(errors.iter().any(|e| e.field == "breakeven.entryFee"));
}

#[test]
fn error_breakeven_negative_rake() {
    let mut input = valid_standard_input();
    input.breakeven = Some(BreakevenInput {
        entry_fee: 110.0,
        buy_in: 120.0,
        rake: -10.0,
        starting_chips: 10000.0,
    });
    let errors = validate(&input).unwrap_err();
    assert!(errors.iter().any(|e| e.field == "breakeven.rake"));
}

#[test]
fn error_breakeven_rake_exceeds_entry_fee() {
    let mut input = valid_standard_input();
    input.breakeven = Some(BreakevenInput {
        entry_fee: 100.0,
        buy_in: 0.0,
        rake: 100.0, // rake >= entry_fee
        starting_chips: 10000.0,
    });
    let errors = validate(&input).unwrap_err();
    assert!(errors.iter().any(|e| e.field == "breakeven.rake"));
}

#[test]
fn error_breakeven_buyin_mismatch() {
    let mut input = valid_standard_input();
    input.breakeven = Some(BreakevenInput {
        entry_fee: 110.0,
        buy_in: 90.0, // should be 100 (110 - 10)
        rake: 10.0,
        starting_chips: 10000.0,
    });
    let errors = validate(&input).unwrap_err();
    assert!(errors.iter().any(|e| e.field == "breakeven.buyIn"));
}

#[test]
fn error_breakeven_zero_starting_chips() {
    let mut input = valid_standard_input();
    input.breakeven = Some(BreakevenInput {
        entry_fee: 110.0,
        buy_in: 100.0,
        rake: 10.0,
        starting_chips: 0.0,
    });
    let errors = validate(&input).unwrap_err();
    assert!(errors.iter().any(|e| e.field == "breakeven.startingChips"));
}
