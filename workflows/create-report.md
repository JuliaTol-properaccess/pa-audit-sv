# Create Report Workflow

## Doel
Genereer een compleet WCAG-auditrapport vanuit een Google Doc export (.md) met één commando.

## Vereisten
- Een .md bestand geëxporteerd vanuit Google Docs
- Het .md bestand moet een `# Bevindingen` sectie bevatten met `## ` subsecties per pagina

## Stappen

1. Exporteer het Google Doc als Markdown (.md)
2. Plaats het bestand in `.tmp/` of noteer het pad
3. Run: `npm run create-report` (of `npm run create-report -- pad/naar/bestand.md`)
4. Beantwoord de interactieve prompts (rapportnaam, opdrachtgever, datum, URL, type)
5. Het script doet automatisch:
   - Markdown splitsen in genummerde issue-bestanden
   - Rapport-map scaffolden vanuit template
   - Frontmatter en metadata invullen
   - Eleventy build uitvoeren
   - Statistieken en charts genereren
6. Preview: `npm run dev` → `http://localhost:1337/pa-wcag-page_NL/reports/<slug>/`
7. Handmatige nazorg:
   - `result.md`: vul "meest opvallende bevindingen" aan
   - `images/opdrachtgever.png`: vervang het logo
8. Commit en push wanneer tevreden

## Tools
- `tools/split-markdown.js` — Splitst enkel .md in genummerde issue-bestanden
- `tools/create-report.js` — Orchestrator: prompts → split → scaffold → build
- `generate-summary.js` — Post-build statistieken en chart-injectie (bestaand)
- `.eleventy.js` — Site generator configuratie (bestaand)

## Randgevallen
- Geen `# Bevindingen` heading → duidelijke foutmelding
- Rapport-map bestaat al → vraagt of je wilt overschrijven
- Logo placeholder → handmatig vervangen na generatie
- Meerdere scope-items → bewerk `index.njk` scope array handmatig

## Geleerde lessen
- (Documenteer problemen hier zodra ze zich voordoen)
