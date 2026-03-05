const fs = require('fs');
const path = require('path');
const prompt = require('prompt');
const slugify = require('slugify');
const { execSync } = require('child_process');
const { splitMarkdown } = require('./split-markdown');

const projectRoot = path.join(__dirname, '..');
const reportsDir = path.join(projectRoot, 'src', 'reports');
const templateDir = path.join(reportsDir, 'report_template');
const tmpDir = path.join(projectRoot, '.tmp');

const DUTCH_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december'
];

function dutchDate() {
  const now = new Date();
  return `${now.getDate()} ${DUTCH_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

function reportIndex() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}

// ─── Fase 1: Input .md bestand vinden ────────────────────────────────

function resolveInputFile() {
  const cliArg = process.argv[2];

  if (cliArg) {
    const resolved = path.resolve(cliArg);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Bestand niet gevonden: ${resolved}`);
    }
    return resolved;
  }

  // Zoek in .tmp/
  if (fs.existsSync(tmpDir)) {
    const mdFiles = fs.readdirSync(tmpDir).filter(f => f.endsWith('.md'));
    if (mdFiles.length > 0) {
      const found = path.join(tmpDir, mdFiles[0]);
      console.log(`Gevonden in .tmp/: ${mdFiles[0]}`);
      return found;
    }
  }

  throw new Error(
    'Geen .md bestand gevonden.\n' +
    'Gebruik: npm run create-report -- pad/naar/bestand.md\n' +
    'Of plaats een .md bestand in de .tmp/ map.'
  );
}

function validateInput(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('# Bevindingen')) {
    throw new Error(
      "Het .md bestand bevat geen '# Bevindingen' sectie.\n" +
      "Zorg dat het geexporteerde Google Doc deze heading bevat."
    );
  }
  return filePath;
}

// ─── Fase 2: Interactieve prompts ────────────────────────────────────

async function getMetadata() {
  prompt.message = '';
  prompt.delimiter = '';
  prompt.start();

  console.log('\n--- Rapport metadata ---\n');

  const schema = {
    properties: {
      reportName: {
        description: 'Rapportnaam / website',
        required: true
      },
      commissioner: {
        description: 'Opdrachtgever',
        required: true
      },
      date: {
        description: `Datum [${dutchDate()}]`,
        default: dutchDate()
      },
      websiteUrl: {
        description: 'Website URL (bijv. https://example.nl)',
        required: true
      },
      platform: {
        description: 'Platform/CMS (optioneel, druk Enter om over te slaan)',
        default: ''
      },
      auditType: {
        description: 'Type audit - volledig of content [volledig]',
        default: 'volledig',
        pattern: /^(volledig|content)$/,
        message: 'Kies "volledig" of "content"'
      }
    }
  };

  const result = await prompt.get(schema);

  const index = reportIndex();
  const slug = `${index}_${slugify(result.reportName, { lower: true, strict: true })}`;

  return {
    reportName: result.reportName,
    commissioner: result.commissioner,
    date: result.date,
    websiteUrl: result.websiteUrl,
    platform: result.platform,
    auditType: result.auditType,
    reportIndex: index,
    slug
  };
}

// ─── Fase 3: Rapport-map scaffolden ──────────────────────────────────

async function scaffoldReport(metadata) {
  const reportDir = path.join(reportsDir, metadata.slug);

  if (fs.existsSync(reportDir)) {
    console.log(`\nMap ${metadata.slug} bestaat al.`);
    const { overwrite } = await prompt.get({
      description: 'Overschrijven? (j/n)',
      name: 'overwrite',
      default: 'n'
    });
    if (overwrite.toLowerCase() !== 'j') {
      throw new Error('Afgebroken door gebruiker.');
    }
    fs.rmSync(reportDir, { recursive: true, force: true });
  }

  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template map niet gevonden: ${templateDir}`);
  }

  fs.cpSync(templateDir, reportDir, { recursive: true });

  // Verwijder template issue-bestand (wordt vervangen door gesplitste bestanden)
  const templateIssue = path.join(reportDir, '01.on_all_pages.md');
  if (fs.existsSync(templateIssue)) {
    fs.unlinkSync(templateIssue);
  }

  console.log(`Rapport-map aangemaakt: src/reports/${metadata.slug}/`);
  return reportDir;
}

// ─── Fase 4: Markdown splitsen ───────────────────────────────────────

function splitAndCopy(inputFile, reportDir) {
  console.log('\nMarkdown splitsen...');
  const result = splitMarkdown(inputFile, reportDir);
  console.log(`${result.sectionCount} secties gesplitst:`);
  result.files.forEach(f => console.log(`  ${f}`));
  return result;
}

// ─── Fase 5: Frontmatter updaten ─────────────────────────────────────

function updateFrontmatter(reportDir, metadata) {
  const indexPath = path.join(reportDir, 'index.njk');
  let content = fs.readFileSync(indexPath, 'utf8');

  const titlePrefix = metadata.auditType === 'content'
    ? 'Content audit digitale toegankelijkheid van website'
    : 'Audit digitale toegankelijkheid van website';

  // Vervang frontmatter waarden regel voor regel
  content = content.replace(
    /^title:.*$/m,
    `title: ${titlePrefix} ${metadata.reportName}`
  );
  content = content.replace(
    /^report_index:.*$/m,
    `report_index: ${metadata.reportIndex}`
  );
  content = content.replace(
    /^  commissioner:.*$/m,
    `  commissioner: ${metadata.commissioner}`
  );
  content = content.replace(
    /^  date:.*$/m,
    `  date: ${metadata.date}`
  );
  content = content.replace(
    /^  platform:.*$/m,
    `  platform: ${metadata.platform}`
  );

  // Scope items updaten met website URL
  const domain = metadata.websiteUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  content = content.replace(
    /^scope:\n(  - .*\n)*/m,
    `scope:\n  - Alle pagina's op de website ${domain}\n  - Alle PDF's op de website ${domain}\n`
  );

  // excludeFromCollections verwijderen indien aanwezig
  content = content.replace(/^excludeFromCollections:.*\n/m, '');

  fs.writeFileSync(indexPath, content, 'utf8');
  console.log('Frontmatter in index.njk bijgewerkt.');
}

// ─── Fase 6: summary.md en result.md updaten ─────────────────────────

function updateSummaryFiles(reportDir, metadata) {
  // summary.md
  const summaryPath = path.join(reportDir, 'summary.md');
  const contentType = metadata.auditType === 'content' ? 'content van de ' : '';
  const summaryContent = `Wij hebben de ${contentType}website ${metadata.websiteUrl} onderzocht in ${metadata.date}. Op dit moment is een deel van de succescriteria als voldoende beoordeeld. In dit rapport lees je welke punten nog verbetering behoeven en hoe deze kunnen worden aangepakt.\n`;
  fs.writeFileSync(summaryPath, summaryContent, 'utf8');

  // result.md
  const resultPath = path.join(reportDir, 'result.md');
  const scCount = metadata.auditType === 'content' ? 'een deel van de' : 'alle';
  const contentOnlyLine = metadata.auditType === 'content'
    ? '\nDit is een contentonderzoek. Daarom zijn de eisen die over de techniek gaan niet meegenomen.\n'
    : '';

  const resultContent = `### Resultaat

In dit onderzoek hebben we ${scCount} 55 toegankelijkheidseisen (succescriteria) uit de norm WCAG 2.2 onderzocht.
Deze audit is uitgevoerd conform de evaluatiemethode [WCAG-EM](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/). Deze methode is aanbevolen door [DigiToegankelijk (Logius)](https://www.digitoegankelijk.nl/).
${contentOnlyLine}

### De meest opvallende bevindingen
*
*
*
`;
  fs.writeFileSync(resultPath, resultContent, 'utf8');

  console.log('summary.md en result.md bijgewerkt.');
}

// ─── Fase 7: Build uitvoeren ─────────────────────────────────────────

function runBuild() {
  console.log('\nEleventy build starten...\n');
  execSync('npx @11ty/eleventy', { cwd: projectRoot, stdio: 'inherit' });

  console.log('\nStatistieken en charts genereren...\n');
  execSync('node generate-summary.js', { cwd: projectRoot, stdio: 'inherit' });
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  try {
    console.log('=== Rapport aanmaken ===\n');

    // Fase 1
    const inputFile = validateInput(resolveInputFile());
    console.log(`Input: ${inputFile}`);

    // Fase 2
    const metadata = await getMetadata();

    // Fase 3
    const reportDir = await scaffoldReport(metadata);

    // Fase 4
    const splitResult = splitAndCopy(inputFile, reportDir);

    // Fase 5
    updateFrontmatter(reportDir, metadata);

    // Fase 6
    updateSummaryFiles(reportDir, metadata);

    // Fase 7
    runBuild();

    // Samenvatting
    console.log('\n=== Rapport klaar! ===');
    console.log(`Map:      src/reports/${metadata.slug}/`);
    console.log(`Output:   dist/${metadata.slug}/index.html`);
    console.log(`Issues:   ${splitResult.sectionCount} secties`);
    console.log(`\nPreview:  npm run dev`);
    console.log(`          http://localhost:1337/${metadata.slug}/`);
    console.log('\nControleer nog handmatig:');
    console.log('  - result.md: vul de "meest opvallende bevindingen" aan');
    console.log('  - images/opdrachtgever.png: vervang het logo van de opdrachtgever');

  } catch (err) {
    console.error(`\nFout: ${err.message}`);
    process.exit(1);
  }
}

main();
