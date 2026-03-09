use crate::types::{BreakevenInput, BreakevenResult};

pub fn compute_breakeven(icm_dollar: f64, input: &BreakevenInput) -> BreakevenResult {
    let profit_loss = icm_dollar - input.entry_fee;
    BreakevenResult {
        icm_dollar,
        entry_fee: input.entry_fee,
        buy_in: input.buy_in,
        profit_loss,
        is_above_breakeven: profit_loss > 0.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_above_breakeven() {
        let input = BreakevenInput {
            entry_fee: 110.0,
            buy_in: 100.0,
            rake: 10.0,
            starting_chips: 10000.0,
        };
        let result = compute_breakeven(200.0, &input);
        assert!(result.is_above_breakeven);
        assert!((result.profit_loss - 90.0).abs() < 1e-10);
    }

    #[test]
    fn test_below_breakeven() {
        let input = BreakevenInput {
            entry_fee: 110.0,
            buy_in: 100.0,
            rake: 10.0,
            starting_chips: 10000.0,
        };
        let result = compute_breakeven(50.0, &input);
        assert!(!result.is_above_breakeven);
        assert!((result.profit_loss - (-60.0)).abs() < 1e-10);
    }
}
