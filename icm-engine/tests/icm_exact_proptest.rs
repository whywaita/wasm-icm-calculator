use icm_engine::icm_exact::compute_equity_exact;
use proptest::prelude::*;

/// Generate a vector of stacks with the given number of players.
/// Each stack is between 100.0 and 50000.0.
fn stacks_strategy(num_players: usize) -> BoxedStrategy<Vec<f64>> {
    prop::collection::vec(100.0..50000.0_f64, num_players..=num_players).boxed()
}

/// Generate payouts that form a valid decreasing prize structure.
/// Returns (stacks, payouts) where payouts sum to a prize pool.
fn stacks_and_payouts_strategy(
    min_players: usize,
    max_players: usize,
) -> BoxedStrategy<(Vec<f64>, Vec<f64>)> {
    (min_players..=max_players)
        .prop_flat_map(|n| {
            let num_paid = if n == 1 { 1 } else { (n / 2).max(1) };
            (
                stacks_strategy(n),
                // Generate raw weights for payouts, then normalize
                prop::collection::vec(1.0..100.0_f64, num_paid..=num_paid),
            )
        })
        .prop_map(|(stacks, raw_payouts)| {
            let prize_pool = 1000.0;
            // Sort descending to make payouts decreasing (first place gets most)
            let mut sorted = raw_payouts;
            sorted.sort_by(|a, b| b.partial_cmp(a).unwrap());
            let sum: f64 = sorted.iter().sum();
            let payouts: Vec<f64> = sorted.iter().map(|p| (p / sum) * prize_pool).collect();
            (stacks, payouts)
        })
        .boxed()
}

proptest! {
    #![proptest_config(ProptestConfig::with_cases(50))]

    #[test]
    fn sum_equity_equals_prize_pool(
        (stacks, payouts) in stacks_and_payouts_strategy(2, 10)
    ) {
        let equities = compute_equity_exact(&stacks, &payouts);
        let sum: f64 = equities.iter().sum();
        let prize_pool: f64 = payouts.iter().sum();
        prop_assert!(
            (sum - prize_pool).abs() < 1e-10,
            "Sum of equities {} != prize pool {} (diff={})",
            sum,
            prize_pool,
            (sum - prize_pool).abs()
        );
    }

    #[test]
    fn chip_leader_has_max_equity(
        (stacks, payouts) in stacks_and_payouts_strategy(2, 10)
    ) {
        let equities = compute_equity_exact(&stacks, &payouts);

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

        prop_assert!(
            (equities[leader_idx] - max_equity).abs() < 1e-10,
            "Chip leader (idx={}, stack={}) equity {} is not max equity {}",
            leader_idx,
            stacks[leader_idx],
            equities[leader_idx],
            max_equity
        );
    }

    #[test]
    fn monotonicity_more_chips_more_equity(
        payouts_raw in prop::collection::vec(1.0..100.0_f64, 2..=5usize),
        base_stacks in prop::collection::vec(100.0..50000.0_f64, 5..=5usize),
    ) {
        // Sort stacks descending so we can check monotonicity
        let mut stacks = base_stacks;
        stacks.sort_by(|a, b| b.partial_cmp(a).unwrap());

        // Ensure stacks are strictly decreasing (add small offsets if tied)
        for i in 1..stacks.len() {
            if stacks[i] >= stacks[i - 1] {
                stacks[i] = stacks[i - 1] - 1.0;
            }
        }
        // Ensure all positive
        if stacks.last().is_none_or(|&s| s <= 0.0) {
            // Skip this case
            return Ok(());
        }

        let num_paid = payouts_raw.len().min(stacks.len());
        let raw = &payouts_raw[..num_paid];
        let mut sorted_raw: Vec<f64> = raw.to_vec();
        sorted_raw.sort_by(|a, b| b.partial_cmp(a).unwrap());
        let sum: f64 = sorted_raw.iter().sum();
        let payouts: Vec<f64> = sorted_raw.iter().map(|p| (p / sum) * 1000.0).collect();

        let equities = compute_equity_exact(&stacks, &payouts);

        for i in 0..stacks.len() - 1 {
            prop_assert!(
                equities[i] >= equities[i + 1] - 1e-10,
                "Monotonicity violation at {}: equity[{}]={} < equity[{}]={}",
                i,
                i,
                equities[i],
                i + 1,
                equities[i + 1]
            );
        }
    }

    #[test]
    fn equal_stacks_equal_equity(
        stack_size in 100.0..50000.0_f64,
        num_players in 2..=8usize,
        payouts_raw in prop::collection::vec(1.0..100.0_f64, 2..=4usize),
    ) {
        let stacks = vec![stack_size; num_players];

        let num_paid = payouts_raw.len().min(num_players);
        let raw = &payouts_raw[..num_paid];
        let mut sorted_raw: Vec<f64> = raw.to_vec();
        sorted_raw.sort_by(|a, b| b.partial_cmp(a).unwrap());
        let sum: f64 = sorted_raw.iter().sum();
        let payouts: Vec<f64> = sorted_raw.iter().map(|p| (p / sum) * 1000.0).collect();

        let equities = compute_equity_exact(&stacks, &payouts);
        let expected = payouts.iter().sum::<f64>() / num_players as f64;

        for (i, &eq) in equities.iter().enumerate() {
            prop_assert!(
                (eq - expected).abs() < 1e-8,
                "Player {} equity {} != expected {} (equal stacks)",
                i,
                eq,
                expected
            );
        }
    }
}
