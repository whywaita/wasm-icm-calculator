const PKO_DEPTH_CUTOFF: f64 = 0.1;

/// Compute PKO bounty equity with recursive inheritance model.
/// Recursion is cut off when r^depth < PKO_DEPTH_CUTOFF.
pub fn compute_pko_bounty_equity(
    stacks: &[f64],
    bounties: &[f64],
    inheritance_rate: f64,
) -> Vec<f64> {
    let max_depth = compute_max_depth(inheritance_rate);
    let n = stacks.len();
    let mut equities = vec![0.0; n];

    for (i, equity) in equities.iter_mut().enumerate() {
        *equity = compute_player_pko_equity(i, stacks, bounties, inheritance_rate, max_depth);
    }

    equities
}

fn compute_max_depth(r: f64) -> usize {
    if r <= 0.0 || r >= 1.0 {
        return if r >= 1.0 { 50 } else { 1 };
    }
    // r^depth < PKO_DEPTH_CUTOFF => depth > log(PKO_DEPTH_CUTOFF) / log(r)
    let depth = (PKO_DEPTH_CUTOFF.ln() / r.ln()).ceil() as usize;
    depth.max(1)
}

fn compute_player_pko_equity(
    player: usize,
    stacks: &[f64],
    bounties: &[f64],
    r: f64,
    max_depth: usize,
) -> f64 {
    let n = stacks.len();
    let mut equity = 0.0;

    for j in 0..n {
        if j == player {
            continue;
        }
        let p_ko = stacks[player] / (stacks[player] + stacks[j]);

        // Immediate payout: (1 - r) * bounty(j)
        let immediate = (1.0 - r) * bounties[j];

        // Inherited bounty equity from recursive model
        let inherited = compute_inherited_equity(player, j, stacks, bounties, r, max_depth, 1);

        equity += p_ko * (immediate + inherited);
    }

    equity
}

fn compute_inherited_equity(
    player: usize,
    target: usize,
    stacks: &[f64],
    bounties: &[f64],
    r: f64,
    max_depth: usize,
    current_depth: usize,
) -> f64 {
    if current_depth >= max_depth {
        return 0.0;
    }

    let n = stacks.len();
    let mut inherited = 0.0;

    // The target player had accumulated bounties from others before being KO'd
    // We model the expected inherited bounty value
    for k in 0..n {
        if k == player || k == target {
            continue;
        }
        let p_target_ko_k = stacks[target] / (stacks[target] + stacks[k]);

        // Bounty inherited from target's KO of k
        let bounty_from_k = r * bounties[k];

        // Further recursive inheritance
        let further =
            compute_inherited_equity(player, k, stacks, bounties, r, max_depth, current_depth + 1);

        inherited += p_target_ko_k * (bounty_from_k + further);
    }

    // Scale by inheritance rate for this depth level
    inherited * r
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pko_finite_and_positive() {
        let stacks = vec![5000.0, 3000.0, 2000.0];
        let bounties = vec![10.0, 10.0, 10.0];
        let pko = compute_pko_bounty_equity(&stacks, &bounties, 0.5);

        for (i, &eq) in pko.iter().enumerate() {
            assert!(eq > 0.0, "PKO equity should be positive at index {}", i);
            assert!(eq.is_finite(), "PKO equity should be finite at index {}", i);
        }
    }

    #[test]
    fn test_pko_zero_inheritance_degenerates() {
        // With inheritance_rate very close to 0, PKO should approach standard bounty
        let stacks = vec![5000.0, 3000.0, 2000.0];
        let bounties = vec![10.0, 10.0, 10.0];

        let standard = crate::bounty::compute_bounty_equity(&stacks, &bounties);
        // Use very small inheritance rate
        let pko = compute_pko_bounty_equity(&stacks, &bounties, 0.001);

        for i in 0..stacks.len() {
            assert!(
                (pko[i] - standard[i]).abs() < 0.5,
                "Near-zero inheritance PKO {} should be close to standard {} at index {}",
                pko[i],
                standard[i],
                i
            );
        }
    }

    #[test]
    fn test_max_depth_calculation() {
        assert_eq!(compute_max_depth(0.5), 4); // 0.5^4 = 0.0625 < 0.1
        assert!(compute_max_depth(0.8) >= 10); // 0.8^11 ≈ 0.086 < 0.1
    }

    #[test]
    fn test_chip_leader_max_pko_equity() {
        let stacks = vec![5000.0, 3000.0, 2000.0];
        let bounties = vec![10.0, 10.0, 10.0];
        let equities = compute_pko_bounty_equity(&stacks, &bounties, 0.5);

        assert!(equities[0] > equities[1]);
        assert!(equities[1] > equities[2]);
    }
}
