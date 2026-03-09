use crate::icm_exact;
use crate::icm_monte_carlo;
use crate::types::PressureCurvePoint;

/// Compute ICM pressure curve by varying a hypothetical player's stack.
/// For exact: 20 data points. For Monte Carlo: 50 data points.
pub fn compute_pressure_curve(
    stacks: &[f64],
    payouts: &[f64],
    is_exact: bool,
) -> Vec<PressureCurvePoint> {
    let max_stack = stacks.iter().cloned().fold(0.0_f64, f64::max);
    let total_chips: f64 = stacks.iter().sum();
    let num_points = if is_exact { 20 } else { 50 };

    // Range from 0 to 2x max stack (but capped at total chips)
    let upper = (max_stack * 2.0).min(total_chips);
    let step = upper / (num_points as f64);

    let mut points = Vec::with_capacity(num_points + 1);

    // Use player 0 as the hypothetical player, adjust others proportionally
    let other_total: f64 = stacks[1..].iter().sum();

    for i in 0..=num_points {
        let hypothetical_stack = step * (i as f64);
        if hypothetical_stack >= total_chips {
            // This player has all chips - they get 1st place prize
            points.push(PressureCurvePoint {
                stack: hypothetical_stack,
                icm_equity: payouts[0],
            });
            continue;
        }

        // Adjust other stacks proportionally
        let remaining = total_chips - hypothetical_stack;
        let scale = if other_total > 0.0 {
            remaining / other_total
        } else {
            0.0
        };

        let mut adjusted_stacks = Vec::with_capacity(stacks.len());
        adjusted_stacks.push(hypothetical_stack);
        for &s in &stacks[1..] {
            adjusted_stacks.push(s * scale);
        }

        let equities = if is_exact {
            icm_exact::compute_equity_exact(&adjusted_stacks, payouts)
        } else {
            icm_monte_carlo::compute_equity_monte_carlo(&adjusted_stacks, payouts, 10_000)
        };

        points.push(PressureCurvePoint {
            stack: hypothetical_stack,
            icm_equity: equities[0],
        });
    }

    points
}
