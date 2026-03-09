import type { ResultMetadata } from "../types";

interface MetadataBarProps {
  t: (key: string) => string;
  metadata: ResultMetadata;
}

export function MetadataBar({ t, metadata }: MetadataBarProps) {
  return (
    <div class="meta-bar">
      <span>
        <span class="meta-label">{t("metaAlgorithm")}</span>
        <span class="meta-val">{metadata.algorithm}</span>
      </span>
      <span>
        <span class="meta-label">{t("metaPlayers")}</span>
        <span class="meta-val">{metadata.playerCount}</span>
      </span>
      <span>
        <span class="meta-label">{t("metaTime")}</span>
        <span class="meta-val">{metadata.calculationTimeMs.toFixed(1)}ms</span>
      </span>
    </div>
  );
}
