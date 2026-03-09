use rand::rngs::SmallRng;
use rand::{Rng, SeedableRng};

/// Compute ICM equity using Monte Carlo simulation with random elimination order sampling.
pub fn compute_equity_monte_carlo(stacks: &[f64], payouts: &[f64], iterations: u32) -> Vec<f64> {
    let n = stacks.len();
    let num_paid = payouts.len();
    let mut rng = SmallRng::from_os_rng();
    let mut total_equity = vec![0.0; n];

    for _ in 0..iterations {
        let order = simulate_elimination_order(stacks, n, num_paid, &mut rng);

        for (position, &player) in order.iter().enumerate() {
            if position < num_paid {
                total_equity[player] += payouts[position];
            }
        }
    }

    let iterations_f64 = f64::from(iterations);
    total_equity.iter().map(|e| e / iterations_f64).collect()
}

fn simulate_elimination_order(
    stacks: &[f64],
    n: usize,
    num_paid: usize,
    rng: &mut SmallRng,
) -> Vec<usize> {
    let mut remaining: Vec<usize> = (0..n).collect();
    let mut remaining_stacks: Vec<f64> = stacks.to_vec();
    let mut finish_order = Vec::with_capacity(num_paid);

    // We only need to determine the first num_paid positions
    // Players are eliminated from last place upward
    while remaining.len() > 1 && finish_order.len() < num_paid {
        let total: f64 = remaining.iter().map(|&i| remaining_stacks[i]).sum();

        // Malmuth-Harville Monte Carlo: select the highest finisher among remaining
        // players with probability proportional to their stack size (larger stack = more
        // likely to finish in a higher position). The selected player is removed from the
        // pool and awarded the next-best finishing position.
        let r: f64 = rng.random_range(0.0..total);
        let mut cumulative = 0.0;
        let mut winner_idx = 0;
        for (idx, &player) in remaining.iter().enumerate() {
            cumulative += remaining_stacks[player];
            if cumulative > r {
                winner_idx = idx;
                break;
            }
        }

        let winner = remaining.remove(winner_idx);
        finish_order.push(winner);

        // The winner's chips are redistributed (they're out of future draws)
        remaining_stacks[winner] = 0.0;
    }

    // If only one player remains and we need more positions
    if !remaining.is_empty() && finish_order.len() < num_paid {
        finish_order.push(remaining[0]);
    }

    finish_order
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sum_equals_prize_pool_mc() {
        let stacks = vec![5000.0, 3000.0, 2000.0];
        let payouts = vec![50.0, 30.0, 20.0];
        let equities = compute_equity_monte_carlo(&stacks, &payouts, 100_000);
        let sum: f64 = equities.iter().sum();
        assert!((sum - 100.0).abs() < 1e-2, "Sum was {}", sum);
    }

    #[test]
    fn test_chip_leader_max_equity_mc() {
        let stacks = vec![8000.0, 3000.0, 2000.0];
        let payouts = vec![50.0, 30.0, 20.0];
        let equities = compute_equity_monte_carlo(&stacks, &payouts, 100_000);
        assert!(
            equities[0] > equities[1],
            "Chip leader should have max equity: {} vs {}",
            equities[0],
            equities[1]
        );
        assert!(equities[1] > equities[2]);
    }

    #[test]
    fn test_equal_stacks_mc() {
        let stacks = vec![5000.0, 5000.0, 5000.0];
        let payouts = vec![50.0, 30.0, 20.0];
        let equities = compute_equity_monte_carlo(&stacks, &payouts, 100_000);
        let expected = 100.0 / 3.0;
        for eq in &equities {
            assert!(
                (eq - expected).abs() < 1.0,
                "Equal stacks should have ~equal equity: {}",
                eq
            );
        }
    }

    #[test]
    fn test_twenty_players_completes() {
        // 20 players with 15 payout positions (Simple MTT default).
        // This must use Monte Carlo and complete without freezing.
        let stacks: Vec<f64> = (1..=20).map(|i| i as f64 * 1000.0).collect();
        let payouts: Vec<f64> = (0..15).map(|i| (15 - i) as f64 * 100.0).collect();
        let equities = compute_equity_monte_carlo(&stacks, &payouts, 100_000);
        let sum: f64 = equities.iter().sum();
        let prize_pool: f64 = payouts.iter().sum();
        assert!(
            (sum - prize_pool).abs() < 5.0,
            "Sum of equities should be close to prize pool: {} vs {}",
            sum,
            prize_pool
        );
        // Player with largest stack should have highest equity
        assert!(equities[19] > equities[0]);
    }

    #[test]
    fn test_eleven_players_mc() {
        // 11 players is just above the exact threshold; must use approximate.
        let stacks: Vec<f64> = (1..=11).map(|i| i as f64 * 1000.0).collect();
        let payouts = vec![50.0, 30.0, 20.0];
        let equities = compute_equity_monte_carlo(&stacks, &payouts, 100_000);
        let sum: f64 = equities.iter().sum();
        assert!(
            (sum - 100.0).abs() < 1.0,
            "Sum of equities should be close to prize pool: {}",
            sum
        );
    }

    #[test]
    fn test_mc_close_to_exact() {
        let stacks = vec![5000.0, 3000.0, 2000.0];
        let payouts = vec![50.0, 30.0, 20.0];
        let mc = compute_equity_monte_carlo(&stacks, &payouts, 100_000);
        // Known exact values (Malmuth-Harville)
        assert!((mc[0] - 38.393).abs() < 1.0, "MC P1: {}", mc[0]);
        assert!((mc[1] - 32.750).abs() < 1.0, "MC P2: {}", mc[1]);
        assert!((mc[2] - 28.857).abs() < 1.0, "MC P3: {}", mc[2]);
    }
}
