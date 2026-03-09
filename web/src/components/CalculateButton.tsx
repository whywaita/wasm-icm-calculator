interface CalculateButtonProps {
  t: (key: string) => string;
  isLoading: boolean;
  onClick: () => void;
}

export function CalculateButton({
  t,
  isLoading,
  onClick,
}: CalculateButtonProps) {
  return (
    <div class="calculate-button-wrapper">
      <button class="btn-primary" disabled={isLoading} onClick={onClick}>
        {isLoading ? t("calculating") : t("calculate")}
      </button>
    </div>
  );
}
