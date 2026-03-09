interface HeaderProps {
  t: (key: string) => string;
  lang: string;
  setLang: (lang: "en" | "ja") => void;
}

export function Header({ t, lang, setLang }: HeaderProps) {
  const base = import.meta.env.BASE_URL;
  const usageHref = `${base}docs/usage-${lang}.html`;

  return (
    <header>
      <div class="header-left">
        <div class="logo">
          <div class="logo-mark">IC</div>
          <h1>
            {t("title")} <span>{t("titleSuffix")}</span>
          </h1>
        </div>
        <nav class="header-nav">
          <a href={usageHref}>Usage</a>
        </nav>
      </div>
      <div class="lang-toggle">
        <button
          class={lang === "en" ? "active" : ""}
          onClick={() => setLang("en")}
        >
          EN
        </button>
        <button
          class={lang === "ja" ? "active" : ""}
          onClick={() => setLang("ja")}
        >
          JA
        </button>
      </div>
    </header>
  );
}
