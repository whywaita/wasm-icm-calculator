interface CalculateButtonProps {
  t: (key: string) => string;
  isLoading: boolean;
  onClick: () => void;
  estimateHint?: string;
}

export function CalculateButton({
  t,
  isLoading,
  onClick,
  estimateHint,
}: CalculateButtonProps) {
  return (
    <div class="calculate-button-wrapper">
      <button class="btn-primary" disabled={isLoading} onClick={onClick}>
        {isLoading ? t("calculating") : t("calculate")}
      </button>
      {estimateHint && <div class="calc-estimate-hint">{estimateHint}</div>}
    </div>
  );
}
