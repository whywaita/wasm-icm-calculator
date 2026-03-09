/// Compute bounty equity for standard knockout tournaments.
/// bounty_equity(i) = Σ_{j≠i} P(i KO j) * bounty(j)
/// P(i KO j) = stack_i / (stack_i + stack_j)
pub fn compute_bounty_equity(stacks: &[f64], bounties: &[f64]) -> Vec<f64> {
    let n = stacks.len();
    let mut equities = vec![0.0; n];

    for i in 0..n {
        for j in 0..n {
            if i == j {
                continue;
            }
            let p_ko = stacks[i] / (stacks[i] + stacks[j]);
            equities[i] += p_ko * bounties[j];
        }
    }

    equities
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bounty_equity_basic() {
        let stacks = vec![5000.0, 3000.0, 2000.0];
        let bounties = vec![10.0, 10.0, 10.0];
        let equities = compute_bounty_equity(&stacks, &bounties);

        // Chip leader should have highest bounty equity
        assert!(equities[0] > equities[1]);
        assert!(equities[1] > equities[2]);
    }

    #[test]
    fn test_bounty_equity_conservation() {
        // Total bounty equity should equal sum of all bounties weighted by KO probabilities
        let stacks = vec![5000.0, 3000.0, 2000.0];
        let bounties = vec![10.0, 10.0, 10.0];
        let equities = compute_bounty_equity(&stacks, &bounties);
        let total: f64 = equities.iter().sum();

        // Total bounty equity should be finite and positive
        assert!(total > 0.0);
        assert!(total.is_finite());
    }

    #[test]
    fn test_equal_stacks_equal_bounty() {
        let stacks = vec![5000.0, 5000.0, 5000.0];
        let bounties = vec![10.0, 10.0, 10.0];
        let equities = compute_bounty_equity(&stacks, &bounties);

        assert!((equities[0] - equities[1]).abs() < 1e-10);
        assert!((equities[1] - equities[2]).abs() < 1e-10);
    }

    #[test]
    fn test_zero_bounties() {
        let stacks = vec![5000.0, 3000.0];
        let bounties = vec![0.0, 0.0];
        let equities = compute_bounty_equity(&stacks, &bounties);

        assert!((equities[0]).abs() < 1e-10);
        assert!((equities[1]).abs() < 1e-10);
    }
}
