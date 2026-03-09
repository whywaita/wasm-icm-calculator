use icm_engine::icm_monte_carlo::compute_equity_monte_carlo;
use proptest::prelude::*;

const MC_ITERATIONS: u32 = 100_000;

/// Generate (stacks, payouts) pairs for Monte Carlo tests.
fn stacks_and_payouts_strategy(
    min_players: usize,
    max_players: usize,
) -> BoxedStrategy<(Vec<f64>, Vec<f64>)> {
    (min_players..=max_players)
        .prop_flat_map(|n| {
            let num_paid = (n / 2).max(1);
            (
                prop::collection::vec(100.0..50000.0_f64, n..=n),
                prop::collection::vec(1.0..100.0_f64, num_paid..=num_paid),
            )
        })
        .prop_map(|(stacks, raw_payouts)| {
            let prize_pool = 1000.0;
            let mut sorted = raw_payouts;
            sorted.sort_by(|a, b| b.partial_cmp(a).unwrap());
            let sum: f64 = sorted.iter().sum();
            let payouts: Vec<f64> = sorted.iter().map(|p| (p / sum) * prize_pool).collect();
            (stacks, payouts)
        })
        .boxed()
}

proptest! {
    #![proptest_config(ProptestConfig::with_cases(20))]

    #[test]
    fn sum_equity_equals_prize_pool_mc(
        (stacks, payouts) in stacks_and_payouts_strategy(2, 10)
    ) {
        let equities = compute_equity_monte_carlo(&stacks, &payouts, MC_ITERATIONS);
        let sum: f64 = equities.iter().sum();
        let prize_pool: f64 = payouts.iter().sum();
        prop_assert!(
            (sum - prize_pool).abs() < 1e-2,
            "MC sum of equities {} != prize pool {} (diff={})",
            sum,
            prize_pool,
            (sum - prize_pool).abs()
        );
    }

    #[test]
    fn chip_leader_has_max_equity_mc(
        (stacks, payouts) in stacks_and_payouts_strategy(2, 10)
    ) {
        let equities = compute_equity_monte_carlo(&stacks, &payouts, MC_ITERATIONS);

        // Find the chip leader (player with maximum stack)
        let leader_idx = stacks
            .iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
            .unwrap()
            .0;

        let max_equity = equities
            .iter()
            .cloned()
            .fold(f64::NEG_INFINITY, f64::max);

        // MC is probabilistic, so we allow a small tolerance
        prop_assert!(
            equities[leader_idx] >= max_equity - 1.0,
            "MC: Chip leader (idx={}, stack={}) equity {} should be near max equity {}",
            leader_idx,
            stacks[leader_idx],
            equities[leader_idx],
            max_equity
        );
    }
}
