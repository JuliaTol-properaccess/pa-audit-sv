const fs = require("fs");
const path = require("path");

const contentRoots = ["./src/reports", "./src/archived-reports"];
const distRoot = "./dist";

const impactRegex = /Impact[^:]*:\s*(Klein|Medium|Groot)/gi;
const typeRegex = /Type[^:]*:\s*(Content|Techniek)/gi;
const wcagRegex = /WCAG[^:]*:\s*([\d\.,\s]+)/gi;

// === 1. Analyseer Markdown-bestanden ===
function analyzeMarkdown(projectPath) {
  const summary = {
    impact: { Klein: 0, Medium: 0, Groot: 0 },
    type: { Content: 0, Techniek: 0 },
    wcag: [],
  };

  if (!fs.existsSync(projectPath)) {
    console.warn(`⚠️ Geen Markdown-map gevonden voor: ${projectPath}`);
    return summary;
  }

  const mdFiles = fs.readdirSync(projectPath).filter((f) => f.endsWith(".md"));
  for (const file of mdFiles) {
    const content = fs.readFileSync(path.join(projectPath, file), "utf-8");

    for (const match of content.matchAll(impactRegex)) {
      const level = match[1];
      if (summary.impact[level] !== undefined) summary.impact[level]++;
    }

    for (const match of content.matchAll(typeRegex)) {
      const t = match[1];
      if (summary.type[t] !== undefined) summary.type[t]++;
    }

    for (const match of content.matchAll(wcagRegex)) {
      const codes = match[1].split(/[\s,]+/).filter(Boolean);
      summary.wcag.push(...codes);
    }
  }

  summary.wcag = [...new Set(summary.wcag)].sort((a, b) => {
    const [a1, a2, a3] = a.split(".").map(Number);
    const [b1, b2, b3] = b.split(".").map(Number);
    return a1 - b1 || a2 - b2 || a3 - b3;
  });

  return summary;
}

// === 1b. Wrap individuele bevindingen in <div class="issue"> ===
function wrapIssuesInDivs(indexPath) {
  if (!fs.existsSync(indexPath)) return;

  let html = fs.readFileSync(indexPath, "utf-8");

  // Zoek de <section id="issues"> sectie
  const issuesMatch = html.match(
    /(<section[^>]+id=["']issues["'][^>]*>)([\s\S]*?)(<\/section>)/i
  );
  if (!issuesMatch) return;

  const [fullMatch, sectionOpen, innerContent, sectionClose] = issuesMatch;

  // Verwerk elke article.issue afzonderlijk
  const updatedInner = innerContent.replace(
    /(<article\s+class="issue"[^>]*>)([\s\S]*?)(<\/article>)/gi,
    (match, articleOpen, articleContent, articleClose) => {
      // Sla over als dit article al div.issue kinderen heeft
      if (/<div\s+class="issue">/i.test(articleContent)) return match;

      // Zoek het einde van de issue-meta div
      const metaMatch = articleContent.match(
        /([\s\S]*?<div\s+class="issue-meta">[\s\S]*?<\/div>\s*)([\s\S]*)/
      );
      if (!metaMatch) return match;

      const [, metaPart, contentPart] = metaMatch;

      if (!contentPart.trim()) return match;

      // Heeft de content h3-elementen (individuele bevindingen)?
      if (/<h3[\s>]/i.test(contentPart)) {
        // Splits op h3-grenzen; content vóór eerste h3 blijft ongewrapt
        const parts = contentPart.split(/(?=<h3[\s>])/i);
        const wrapped = parts
          .map((part) => {
            if (/<h3[\s>]/i.test(part)) {
              return `<div class="issue">\n${part}</div>\n`;
            }
            return part; // pre-h3 content (bijv. "Link naar pagina")
          })
          .join("");

        return `${articleOpen}${metaPart}${wrapped}${articleClose}`;
      } else {
        // Geen h3 — wrap alle content in een enkele div.issue
        return `${articleOpen}${metaPart}\n<div class="issue">\n${contentPart}</div>\n${articleClose}`;
      }
    }
  );

  html = html.replace(fullMatch, `${sectionOpen}${updatedInner}${sectionClose}`);
  fs.writeFileSync(indexPath, html, "utf-8");
  console.log(
    `🔧 Issue-wrappers toegevoegd voor ${path.basename(indexPath)}`
  );
}

// === 2. Nummer issues in HTML ===
function nummerIssues(indexPath) {
  if (!fs.existsSync(indexPath)) return;

  let html = fs.readFileSync(indexPath, "utf-8");

  // Zoek het <section id="issues"> blok
  const issuesMatch = html.match(/(<section[^>]+id=["']issues["'][^>]*>)([\s\S]*?)(<\/section>)/i);
  if (!issuesMatch) {
    console.warn(`⚠️ Geen <section id="issues"> gevonden in ${path.basename(indexPath)}`);
    return;
  }

  const [fullMatch, openTag, innerContent, closeTag] = issuesMatch;

  // Nummer alleen <h3> binnen de issues sectie
  let teller = 1;
  const updatedInner = innerContent.replace(
    /(<h3[^>]*>)(?!Issue nr\.)\s*([^<]+)/g,
    (_, openTag, text) => `${openTag}Issue nr. ${teller++} - ${text}`
  );

  // Vervang de originele sectie door de nieuwe versie
  html = html.replace(fullMatch, `${openTag}${updatedInner}${closeTag}`);

  fs.writeFileSync(indexPath, html, "utf-8");
  console.log(`🔢 Issue-nummers toegevoegd binnen #issues voor ${path.basename(indexPath)}`);
}

// === 3. Voeg charts toe ===
function injectCharts(indexPath, summary) {
  if (!fs.existsSync(indexPath)) {
    console.warn(`⚠️ index.html niet gevonden: ${indexPath}`);
    return;
  }

  let html = fs.readFileSync(indexPath, "utf-8");
  html = html.replace(/<div class="(charts|wcag-summary)"[\s\S]*?<\/script>/gi, "");

  const chartScript = `
  <div class="wcag-summary">
    <h4>Afgekeurde WCAG Succescriteria</h4>
    <p>Totaal: ${summary.wcag.length} van 55</p>
    <ul class="wcag-list">
      ${summary.wcag.map((sc) => `<li>${sc}</li>`).join("\n")}
    </ul>
  </div>

  <div class="charts">
    <figure class="chart">
      <canvas id="impactChart"></canvas>
      <figcaption>Impact — Klein: ${summary.impact.Klein}, Medium: ${summary.impact.Medium}, Groot: ${summary.impact.Groot}</figcaption>
    </figure>

    <figure class="chart">
      <canvas id="typeChart"></canvas>
      <figcaption>Type — Content: ${summary.type.Content}, Techniek: ${summary.type.Techniek}</figcaption>
    </figure>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    const impactCtx = document.getElementById('impactChart');
    const typeCtx = document.getElementById('typeChart');
    new Chart(impactCtx, {
      type: 'bar',
      data: { labels: ['Klein', 'Medium', 'Groot'], datasets: [{ data: [${summary.impact.Klein}, ${summary.impact.Medium}, ${summary.impact.Groot}], backgroundColor: ['#D97708','#2663EB','#C00000'] }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
    new Chart(typeCtx, {
      type: 'pie',
      data: { labels: ['Content', 'Techniek'], datasets: [{ data: [${summary.type.Content}, ${summary.type.Techniek}], backgroundColor: ['#2663EB','#C00000'] }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  </script>`;

  const updatedHtml = html.replace(/(<h[23][^>]*>\s*Resultaat\s*<\/h[23]>)/i, `$1\n${chartScript}`);
  fs.writeFileSync(indexPath, updatedHtml, "utf-8");
  console.log(`✅ Charts toegevoegd aan ${indexPath}`);
}

// === 4. Hoofdproces ===
function run() {
  if (!fs.existsSync(distRoot)) {
    console.warn("⚠️ Geen /dist map gevonden. Draai eerst: npm run build");
    return;
  }

  // Verzamel rapporten uit alle bronmappen
  for (const contentRoot of contentRoots) {
    if (!fs.existsSync(contentRoot)) continue;

    const projects = fs
      .readdirSync(contentRoot)
      .filter((f) => fs.lstatSync(path.join(contentRoot, f)).isDirectory());

    for (const project of projects) {
      const mdPath = path.join(contentRoot, project);
      const distPath = path.join(distRoot, project, "index.html");
      const summary = analyzeMarkdown(mdPath);

      const jsonPath = path.join(distRoot, project, "data-summary.json");
      fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

      // 🔧 Eerst issues wrappen, dan nummeren, dan charts injecteren
      wrapIssuesInDivs(distPath);
      nummerIssues(distPath);
      injectCharts(distPath, summary);
    }
  }

  console.log("✨ Klaar! Statistieken en issue-nummers succesvol toegevoegd aan alle rapporten.");
}

run();