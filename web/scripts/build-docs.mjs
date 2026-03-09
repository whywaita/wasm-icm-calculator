import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = resolve(__dirname, "../../docs");
const outDir = resolve(__dirname, "../dist/docs");

const pages = [
  { src: "usage-en.md", out: "usage-en.html", lang: "en", title: "Usage Guide – ICM Calculator" },
  { src: "usage-ja.md", out: "usage-ja.html", lang: "ja", title: "使い方ガイド – ICM Calculator" },
];

const htmlTemplate = (title, lang, body, otherLang, otherHref) => `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg: #fafaf9;
      --surface: #ffffff;
      --border: #e7e5e4;
      --text: #1c1917;
      --text-secondary: #57534e;
      --text-tertiary: #a8a29e;
      --accent: #0d9488;
      --accent-hover: #0f766e;
      --surface-alt: #f5f5f4;
      --font: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --radius-lg: 12px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 0 20px 80px; }
    header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 0; margin-bottom: 32px;
    }
    .header-left { display: flex; align-items: center; gap: 24px; }
    .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .logo-mark {
      width: 36px; height: 36px; background: var(--accent); border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-family: var(--mono); font-size: 0.85rem; font-weight: 700;
    }
    .logo h1 { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.03em; color: var(--text); }
    .logo h1 span { color: var(--text-tertiary); font-weight: 400; }
    nav a {
      font-size: 0.92rem; font-weight: 500; padding: 6px 14px;
      border-radius: 6px; color: var(--text-secondary); text-decoration: none;
    }
    nav a:hover { color: var(--text); background: var(--surface-alt); }
    .lang-toggle { display: flex; background: var(--surface-alt); border-radius: 6px; padding: 2px; }
    .lang-toggle a {
      font-size: 0.9rem; font-weight: 600; padding: 6px 14px;
      border-radius: 4px; text-decoration: none; color: var(--text-tertiary);
    }
    .lang-toggle a.active { background: var(--surface); color: var(--text); box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
    .content {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 32px 40px; line-height: 1.7;
    }
    .content h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
    .content h2 { font-size: 1.25rem; font-weight: 700; margin-top: 32px; margin-bottom: 12px; }
    .content h3 { font-size: 1.05rem; font-weight: 600; margin-top: 24px; margin-bottom: 8px; }
    .content p { margin-bottom: 12px; color: var(--text-secondary); }
    .content ul { margin-bottom: 12px; padding-left: 24px; }
    .content li { margin-bottom: 6px; color: var(--text-secondary); }
    .content strong { color: var(--text); font-weight: 600; }
    .content code { font-family: var(--mono); font-size: 0.9em; background: var(--surface-alt); padding: 2px 6px; border-radius: 4px; }
    @media (max-width: 640px) {
      .container { padding: 0 12px 60px; }
      header { padding: 16px 0; margin-bottom: 20px; }
      .header-left { gap: 12px; }
      .content { padding: 20px 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-left">
        <a class="logo" href="/wasm-icm-calculator/">
          <div class="logo-mark">IC</div>
          <h1>ICM <span>Calculator</span></h1>
        </a>
        <nav>
          <a href="/wasm-icm-calculator/">Calculator</a>
        </nav>
      </div>
      <div class="lang-toggle">
        <a href="usage-en.html" class="${lang === "en" ? "active" : ""}">EN</a>
        <a href="usage-ja.html" class="${lang === "ja" ? "active" : ""}">JA</a>
      </div>
    </header>
    <div class="content">${body}</div>
  </div>
</body>
</html>`;

mkdirSync(outDir, { recursive: true });

for (const page of pages) {
  const md = readFileSync(resolve(docsDir, page.src), "utf-8");
  const body = marked.parse(md);
  const other = pages.find((p) => p.lang !== page.lang);
  const html = htmlTemplate(page.title, page.lang, body, other.lang, other.out);
  writeFileSync(resolve(outDir, page.out), html);
  console.log(`Built ${page.out}`);
}
