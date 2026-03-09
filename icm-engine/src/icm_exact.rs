use std::collections::HashMap;

type MemoCache = HashMap<(usize, u64), f64>;

/// Compute exact ICM equity using Malmuth-Harville model with bitmask memoization.
/// Recursion depth is pruned by the number of payout positions.
pub fn compute_equity_exact(stacks: &[f64], payouts: &[f64]) -> Vec<f64> {
    let n = stacks.len();
    let num_paid = payouts.len();
    let mut cache: MemoCache = HashMap::new();
    let mut equities = vec![0.0; n];

    for (i, equity) in equities.iter_mut().enumerate() {
        *equity = compute_player_equity(i, stacks, payouts, num_paid, &mut cache);
    }

    equities
}

fn compute_player_equity(
    player: usize,
    stacks: &[f64],
    payouts: &[f64],
    num_paid: usize,
    cache: &mut MemoCache,
) -> f64 {
    let n = stacks.len();
    let eliminated: u64 = 0;
    let mut equity = 0.0;

    for (position, &payout) in payouts.iter().enumerate().take(num_paid) {
        let prob = finish_probability(player, position, stacks, eliminated, n, num_paid, cache);
        equity += prob * payout;
    }

    equity
}

fn finish_probability(
    player: usize,
    position: usize,
    stacks: &[f64],
    eliminated: u64,
    n: usize,
    num_paid: usize,
    cache: &mut MemoCache,
) -> f64 {
    if position == 0 {
        return first_place_probability(player, stacks, eliminated, n);
    }

    let key = (player * num_paid + position, eliminated);
    if let Some(&cached) = cache.get(&key) {
        return cached;
    }

    let active_total: f64 = (0..n)
        .filter(|&j| eliminated & (1 << j) == 0)
        .map(|j| stacks[j])
        .sum();

    let mut prob = 0.0;
    for j in 0..n {
        if j == player || eliminated & (1 << j) != 0 {
            continue;
        }
        let p_j_first = stacks[j] / active_total;
        let new_eliminated = eliminated | (1 << j);
        let p_player_given = finish_probability(
            player,
            position - 1,
            stacks,
            new_eliminated,
            n,
            num_paid,
            cache,
        );
        prob += p_j_first * p_player_given;
    }

    cache.insert(key, prob);
    prob
}

fn first_place_probability(player: usize, stacks: &[f64], eliminated: u64, n: usize) -> f64 {
    if eliminated & (1 << player) != 0 {
        return 0.0;
    }
    let active_total: f64 = (0..n)
        .filter(|&j| eliminated & (1 << j) == 0)
        .map(|j| stacks[j])
        .sum();

    if active_total == 0.0 {
        return 0.0;
    }

    stacks[player] / active_total
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_two_players_equal() {
        let stacks = vec![5000.0, 5000.0];
        let payouts = vec![60.0, 40.0];
        let equities = compute_equity_exact(&stacks, &payouts);
        let sum: f64 = equities.iter().sum();
        assert!((sum - 100.0).abs() < 1e-10, "Sum was {}", sum);
        assert!((equities[0] - equities[1]).abs() < 1e-10);
        assert!((equities[0] - 50.0).abs() < 1e-10);
    }

    #[test]
    fn test_three_players_known_values() {
        // 3 players: 5000, 3000, 2000 with payouts 50, 30, 20
        // Reference: HoldemResources
        let stacks = vec![5000.0, 3000.0, 2000.0];
        let payouts = vec![50.0, 30.0, 20.0];
        let equities = compute_equity_exact(&stacks, &payouts);

        let sum: f64 = equities.iter().sum();
        assert!((sum - 100.0).abs() < 1e-10, "Sum was {}", sum);

        // Chip leader has max equity
        assert!(equities[0] > equities[1]);
        assert!(equities[1] > equities[2]);

        // Verified by hand calculation (Malmuth-Harville):
        // Player 1 (5000): ~38.393
        // Player 2 (3000): ~32.750
        // Player 3 (2000): ~28.857
        assert!(
            (equities[0] - 38.393).abs() < 0.01,
            "P1 equity: {}",
            equities[0]
        );
        assert!(
            (equities[1] - 32.750).abs() < 0.01,
            "P2 equity: {}",
            equities[1]
        );
        assert!(
            (equities[2] - 28.857).abs() < 0.01,
            "P3 equity: {}",
            equities[2]
        );
    }

    #[test]
    fn test_monotonicity() {
        let stacks = vec![8000.0, 5000.0, 3000.0, 2000.0, 1000.0];
        let payouts = vec![40.0, 25.0, 18.0, 12.0, 5.0];
        let equities = compute_equity_exact(&stacks, &payouts);

        for i in 0..stacks.len() - 1 {
            assert!(
                equities[i] >= equities[i + 1],
                "Monotonicity violation at {}: {} < {}",
                i,
                equities[i],
                equities[i + 1]
            );
        }
    }

    #[test]
    fn test_sum_equals_prize_pool() {
        let stacks = vec![3000.0, 3000.0, 3000.0, 1000.0];
        let payouts = vec![50.0, 30.0, 20.0];
        let equities = compute_equity_exact(&stacks, &payouts);
        let sum: f64 = equities.iter().sum();
        assert!((sum - 100.0).abs() < 1e-10, "Sum was {}", sum);
    }

    #[test]
    fn test_ten_players_completes() {
        // 10 players is the exact threshold boundary; must complete quickly.
        let stacks: Vec<f64> = (1..=10).map(|i| i as f64 * 1000.0).collect();
        let payouts = vec![50.0, 30.0, 20.0];
        let equities = compute_equity_exact(&stacks, &payouts);
        let sum: f64 = equities.iter().sum();
        assert!(
            (sum - 100.0).abs() < 1e-6,
            "Sum of equities should equal prize pool: {}",
            sum
        );
        // Chip leader should have the highest equity
        assert!(equities[9] > equities[0]);
    }

    #[test]
    fn test_equal_stacks_equal_equity() {
        let stacks = vec![5000.0, 5000.0, 5000.0];
        let payouts = vec![50.0, 30.0, 20.0];
        let equities = compute_equity_exact(&stacks, &payouts);
        let expected = 100.0 / 3.0;
        for eq in &equities {
            assert!((eq - expected).abs() < 1e-10);
        }
    }
}
