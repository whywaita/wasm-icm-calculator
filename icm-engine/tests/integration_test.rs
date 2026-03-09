use icm_engine::bounty::compute_bounty_equity;
use icm_engine::icm_exact::compute_equity_exact;
use icm_engine::pko::compute_pko_bounty_equity;
use icm_engine::types::{CalculationInput, PkoConfig, PlayerInput, PrizeStructure};
use icm_engine::validation::validate;

/// End-to-end test for a standard ICM tournament:
/// validate input, compute equities, verify results.
#[test]
fn standard_tournament_end_to_end() {
    let input = CalculationInput {
        tournament_type: "standard".to_string(),
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
            PlayerInput {
                name: Some("Charlie".to_string()),
                stack: 2000.0,
                bounty: None,
            },
        ],
        prize_structure: PrizeStructure {
            payout_type: "absolute".to_string(),
            payouts: vec![50.0, 30.0, 20.0],
            total_prize_pool: Some(100.0),
        },
        pko_config: None,
        breakeven: None,
    };

    // Validation should pass
    assert!(validate(&input).is_ok());

    // Compute equities
    let stacks: Vec<f64> = input.players.iter().map(|p| p.stack).collect();
    let payouts = input.resolved_payouts();
    let equities = compute_equity_exact(&stacks, &payouts);

    // Sum should equal prize pool
    let sum: f64 = equities.iter().sum();
    let prize_pool: f64 = payouts.iter().sum();
    assert!(
        (sum - prize_pool).abs() < 1e-10,
        "Sum {} != prize pool {}",
        sum,
        prize_pool
    );

    // Chip leader has max equity
    assert!(equities[0] > equities[1]);
    assert!(equities[1] > equities[2]);

    // All equities are positive
    for eq in &equities {
        assert!(*eq > 0.0);
    }
}

/// End-to-end test for a bounty tournament.
#[test]
fn bounty_tournament_end_to_end() {
    let input = CalculationInput {
        tournament_type: "bounty".to_string(),
        players: vec![
            PlayerInput {
                name: Some("Alice".to_string()),
                stack: 5000.0,
                bounty: Some(10.0),
            },
            PlayerInput {
                name: Some("Bob".to_string()),
                stack: 3000.0,
                bounty: Some(10.0),
            },
            PlayerInput {
                name: Some("Charlie".to_string()),
                stack: 2000.0,
                bounty: Some(10.0),
            },
        ],
        prize_structure: PrizeStructure {
            payout_type: "absolute".to_string(),
            payouts: vec![50.0, 30.0, 20.0],
            total_prize_pool: Some(100.0),
        },
        pko_config: None,
        breakeven: None,
    };

    assert!(validate(&input).is_ok());

    let stacks: Vec<f64> = input.players.iter().map(|p| p.stack).collect();
    let bounties: Vec<f64> = input.players.iter().map(|p| p.bounty.unwrap()).collect();
    let payouts = input.resolved_payouts();

    // ICM equities
    let icm_equities = compute_equity_exact(&stacks, &payouts);
    let icm_sum: f64 = icm_equities.iter().sum();
    assert!((icm_sum - 100.0).abs() < 1e-10);

    // Bounty equities
    let bounty_equities = compute_bounty_equity(&stacks, &bounties);
    for eq in &bounty_equities {
        assert!(eq.is_finite());
        assert!(*eq >= 0.0);
    }

    // Chip leader should have highest bounty equity too (equal bounties)
    assert!(bounty_equities[0] > bounty_equities[1]);
    assert!(bounty_equities[1] > bounty_equities[2]);

    // Total equity = ICM + bounty
    let total_equities: Vec<f64> = icm_equities
        .iter()
        .zip(bounty_equities.iter())
        .map(|(icm, b)| icm + b)
        .collect();

    // Total equities should be ordered by stack size
    assert!(total_equities[0] > total_equities[1]);
    assert!(total_equities[1] > total_equities[2]);
}

/// End-to-end test for a PKO tournament.
#[test]
fn pko_tournament_end_to_end() {
    let input = CalculationInput {
        tournament_type: "pko".to_string(),
        players: vec![
            PlayerInput {
                name: None,
                stack: 8000.0,
                bounty: Some(20.0),
            },
            PlayerInput {
                name: None,
                stack: 5000.0,
                bounty: Some(15.0),
            },
            PlayerInput {
                name: None,
                stack: 3000.0,
                bounty: Some(10.0),
            },
        ],
        prize_structure: PrizeStructure {
            payout_type: "absolute".to_string(),
            payouts: vec![50.0, 30.0, 20.0],
            total_prize_pool: Some(100.0),
        },
        pko_config: Some(PkoConfig {
            inheritance_rate: 0.5,
        }),
        breakeven: None,
    };

    assert!(validate(&input).is_ok());

    let stacks: Vec<f64> = input.players.iter().map(|p| p.stack).collect();
    let bounties: Vec<f64> = input.players.iter().map(|p| p.bounty.unwrap()).collect();
    let payouts = input.resolved_payouts();
    let inheritance_rate = input.pko_config.as_ref().unwrap().inheritance_rate;

    // ICM equities
    let icm_equities = compute_equity_exact(&stacks, &payouts);
    let icm_sum: f64 = icm_equities.iter().sum();
    assert!((icm_sum - 100.0).abs() < 1e-10);

    // PKO bounty equities
    let pko_equities = compute_pko_bounty_equity(&stacks, &bounties, inheritance_rate);
    for eq in &pko_equities {
        assert!(eq.is_finite());
        assert!(*eq > 0.0);
    }

    // Chip leader should have highest PKO equity
    assert!(pko_equities[0] > pko_equities[1]);
    assert!(pko_equities[1] > pko_equities[2]);
}

/// Test percentage payout type resolution.
#[test]
fn percentage_payout_resolution() {
    let input = CalculationInput {
        tournament_type: "standard".to_string(),
        players: vec![
            PlayerInput {
                name: None,
                stack: 5000.0,
                bounty: None,
            },
            PlayerInput {
                name: None,
                stack: 5000.0,
                bounty: None,
            },
        ],
        prize_structure: PrizeStructure {
            payout_type: "percentage".to_string(),
            payouts: vec![60.0, 40.0], // 60% and 40%
            total_prize_pool: Some(1000.0),
        },
        pko_config: None,
        breakeven: None,
    };

    assert!(validate(&input).is_ok());

    let payouts = input.resolved_payouts();
    assert!((payouts[0] - 600.0).abs() < 1e-10);
    assert!((payouts[1] - 400.0).abs() < 1e-10);

    let stacks: Vec<f64> = input.players.iter().map(|p| p.stack).collect();
    let equities = compute_equity_exact(&stacks, &payouts);

    // Equal stacks should give equal equities
    assert!((equities[0] - equities[1]).abs() < 1e-10);
    assert!((equities[0] - 500.0).abs() < 1e-10);
}

/// Test that invalid input is properly rejected.
#[test]
fn invalid_input_rejected() {
    // No players
    let input = CalculationInput {
        tournament_type: "standard".to_string(),
        players: vec![],
        prize_structure: PrizeStructure {
            payout_type: "absolute".to_string(),
            payouts: vec![100.0],
            total_prize_pool: Some(100.0),
        },
        pko_config: None,
        breakeven: None,
    };

    let result = validate(&input);
    assert!(result.is_err());
    let errors = result.unwrap_err();
    assert!(!errors.is_empty());
}

/// Test that multiple validation errors are collected.
#[test]
fn multiple_validation_errors_collected() {
    let input = CalculationInput {
        tournament_type: "bounty".to_string(),
        players: vec![PlayerInput {
            name: None,
            stack: -100.0, // negative stack
            bounty: None,  // missing bounty for bounty tournament
        }],
        prize_structure: PrizeStructure {
            payout_type: "absolute".to_string(),
            payouts: vec![],
            total_prize_pool: Some(100.0),
        },
        pko_config: None,
        breakeven: None,
    };

    let errors = validate(&input).unwrap_err();
    // Should have errors for: too few players, negative stack, missing bounty, empty payouts
    assert!(
        errors.len() >= 3,
        "Expected at least 3 errors, got {}: {:?}",
        errors.len(),
        errors
    );
}

/// Test exact vs Monte Carlo convergence for small player counts.
#[test]
fn exact_vs_monte_carlo_convergence() {
    use icm_engine::icm_monte_carlo::compute_equity_monte_carlo;

    let stacks = vec![5000.0, 3000.0, 2000.0];
    let payouts = vec![50.0, 30.0, 20.0];

    let exact = compute_equity_exact(&stacks, &payouts);
    let mc = compute_equity_monte_carlo(&stacks, &payouts, 100_000);

    for i in 0..stacks.len() {
        assert!(
            (exact[i] - mc[i]).abs() < 2.0,
            "Player {} exact={} mc={} diff={}",
            i,
            exact[i],
            mc[i],
            (exact[i] - mc[i]).abs()
        );
    }
}
