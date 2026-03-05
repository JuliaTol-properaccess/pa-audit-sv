const fs = require('fs');
const path = require('path');

// WCAG SC → type beperking mapping
// Bron: https://www.properaccess.nl/blog/indeling-van-succescriteria-per-type-beperking/
const SC_BEPERKING = {
  '1.1.1': ['visueel'],
  '1.2.1': ['auditief', 'visueel'],
  '1.2.2': ['auditief'],
  '1.2.3': ['visueel'],
  '1.2.4': ['auditief'],
  '1.2.5': ['visueel'],
  '1.3.1': ['visueel'],
  '1.3.2': ['visueel'],
  '1.3.3': ['visueel'],
  '1.3.4': ['visueel', 'cognitief', 'motorisch'],
  '1.3.5': ['visueel', 'cognitief'],
  '1.4.1': ['visueel'],
  '1.4.2': ['auditief'],
  '1.4.3': ['visueel'],
  '1.4.4': ['visueel'],
  '1.4.5': ['visueel'],
  '1.4.10': ['visueel', 'cognitief'],
  '1.4.11': ['visueel'],
  '1.4.12': ['visueel'],
  '1.4.13': ['visueel', 'motorisch'],
  '2.1.1': ['motorisch'],
  '2.1.2': ['motorisch'],
  '2.1.4': ['motorisch'],
  '2.2.1': ['cognitief'],
  '2.2.2': ['cognitief'],
  '2.3.1': ['neurologisch'],
  '2.3.3': ['neurologisch'],
  '2.4.1': ['motorisch'],
  '2.4.2': ['cognitief', 'visueel'],
  '2.4.3': ['motorisch'],
  '2.4.4': ['visueel'],
  '2.4.5': ['cognitief'],
  '2.4.6': ['cognitief'],
  '2.4.7': ['cognitief', 'motorisch'],
  '2.4.11': ['cognitief', 'motorisch'],
  '2.5.1': ['motorisch'],
  '2.5.2': ['motorisch'],
  '2.5.3': ['visueel'],
  '2.5.4': ['motorisch'],
  '2.5.5': ['motorisch'],
  '2.5.7': ['motorisch'],
  '2.5.8': ['motorisch'],
  '3.1.1': ['cognitief', 'visueel'],
  '3.1.2': ['cognitief', 'visueel'],
  '3.2.1': ['cognitief', 'motorisch'],
  '3.2.2': ['cognitief', 'motorisch'],
  '3.2.3': ['cognitief', 'motorisch'],
  '3.2.4': ['cognitief', 'motorisch'],
  '3.2.6': ['cognitief'],
  '3.3.1': ['cognitief'],
  '3.3.2': ['cognitief'],
  '3.3.3': ['cognitief'],
  '3.3.4': ['cognitief'],
  '3.3.5': ['cognitief'],
  '3.3.7': ['cognitief', 'motorisch'],
  '3.3.8': ['cognitief'],
  '4.1.2': ['visueel'],
  '4.1.3': ['visueel'],
};

// WCAG Richtlijn op basis van eerste cijfer van SC nummer
const RICHTLIJNEN = {
  '1': 'Waarneembaar',
  '2': 'Bedienbaar',
  '3': 'Begrijpelijk',
  '4': 'Robuust',
};

/**
 * Zoek de relevante beperkingstypen op voor een of meer WCAG SC nummers.
 * @param {string} wcagField - bijv. "1.3.1, 4.1.2"
 * @returns {string} - bijv. "Visueel"
 */
function lookupBeperkingen(wcagField) {
  const scNumbers = wcagField.split(/[,;]\s*/);
  const types = new Set();

  scNumbers.forEach(sc => {
    const trimmed = sc.trim();
    if (SC_BEPERKING[trimmed]) {
      SC_BEPERKING[trimmed].forEach(t => types.add(t));
    }
  });

  if (types.size === 0) return '';

  // Capitalize eerste letter
  return [...types].map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
}

/**
 * Zoek de WCAG richtlijn(en) op voor een of meer SC nummers.
 * @param {string} wcagField - bijv. "1.3.1, 4.1.2"
 * @returns {string} - bijv. "Waarneembaar, Robuust"
 */
function lookupRichtlijn(wcagField) {
  const scNumbers = wcagField.split(/[,;]\s*/);
  const richtlijnen = new Set();

  scNumbers.forEach(sc => {
    const firstDigit = sc.trim().charAt(0);
    if (RICHTLIJNEN[firstDigit]) {
      richtlijnen.add(RICHTLIJNEN[firstDigit]);
    }
  });

  return [...richtlijnen].join(', ');
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function cleanContent(text) {
  let cleaned = text;

  // 1. Verwijder escape-backslashes
  cleaned = cleaned.replace(/\\([#<>!/_\[\]\(\)\*`])/g, '$1');

  // 2. Zet losse links tussen <>
  cleaned = cleaned.replace(
    /(?<![\]\(])(?<![<])\b((?:https?:\/\/|mailto:)[^\s)>\]]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})(?![)>])/gi,
    (m) => `<${m}>`
  );

  // 3. Converteer afbeeldingen in screenshots
  cleaned = cleaned.replace(
    /<figure class="screenshot">([\s\S]*?)<\/figure>/g,
    (match, inner) => {
      let innerClean = inner.replace(/\\([#<>!/_\[\]\(\)\*`])/g, '$1');
      innerClean = innerClean.replace(/!\[\]\((.*?)\)/g, '<img src="$1" alt="">').trim();
      return `<figure class="screenshot">\n${innerClean}\n</figure>`;
    }
  );

  // 4. Bescherm meta- en figure-blokken
  const protectedBlocks = [];
  cleaned = cleaned.replace(
    /<div class="meta">[\s\S]*?<\/div>|<figure class="screenshot">[\s\S]*?<\/figure>/g,
    (block) => {
      protectedBlocks.push(block);
      return `__BLOCK_${protectedBlocks.length - 1}__`;
    }
  );

  // 5. Zet kleurcodes in backticks
  cleaned = cleaned.replace(
    /(?<![`'"a-zA-Z0-9])#([0-9A-Fa-f]{3,6})(?![a-zA-Z0-9])/g,
    '`#$1`'
  );

  // 6. Herstel beschermde blokken
  protectedBlocks.forEach((block, i) => {
    cleaned = cleaned.replace(`__BLOCK_${i}__`, block);
  });

  return cleaned;
}

function wrapIssues(markdown) {
  const parts = markdown.split(/^###\s+/gm);
  if (parts.length === 1) return markdown;

  let result = parts[0].trim();

  for (let i = 1; i < parts.length; i++) {
    const [titleLine, ...rest] = parts[i].split('\n');
    const body = rest.join('\n').trim();

    result += `

<div class="issue">

### ${titleLine.trim()}

${body}

</div>
`;
  }

  return result.trim();
}

/**
 * Converteert platte-tekst bevindingen naar gestructureerde HTML.
 * Detecteert het patroon: titel + inspringende metadata (Impact/Type/WCAG/EN)
 * en zet dit om naar <div class="issue"> met <div class="meta"> en #### Oplossing:
 * Als het plain-text patroon niet wordt gedetecteerd, valt terug op wrapIssues.
 */
function formatIssues(text) {
  // Detecteer platte-tekst formaat: inspringende metadata blokken
  if (!/^\s{4}Impact:/m.test(text)) {
    return wrapIssues(text); // Al geformateerd of geen issues
  }

  const lines = text.split('\n');

  // Pass 1: Vind alle bevinding-startposities
  // Een bevinding begint met een titel gevolgd (binnen 1-2 regels) door inspringende metadata
  const findingStarts = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (/^\s{4}/.test(line)) continue; // inspringende regel (metadata)

    // Kijk vooruit: volgt er een metadata blok?
    for (let j = i + 1; j <= i + 2 && j < lines.length; j++) {
      if (/^\s{4}Impact:/.test(lines[j])) {
        findingStarts.push(i);
        break;
      }
      if (lines[j].trim() !== '') break;
    }
  }

  if (findingStarts.length === 0) {
    return wrapIssues(text);
  }

  const result = [];

  // Preamble (tekst voor de eerste bevinding, bijv. "Link naar pagina...")
  const preamble = lines.slice(0, findingStarts[0]).join('\n').trim();
  if (preamble) result.push(preamble);

  // Pass 2: Verwerk elke bevinding
  for (let f = 0; f < findingStarts.length; f++) {
    const start = findingStarts[f];
    const end = f + 1 < findingStarts.length ? findingStarts[f + 1] : lines.length;

    const title = lines[start].trim();

    // Parse metadata
    const meta = { impact: '', type: '', wcag: '', en: '' };
    let metaEnd = start + 1;

    for (let i = start + 1; i < end; i++) {
      const line = lines[i];
      if (/^\s{4}Impact:/.test(line)) meta.impact = line.replace(/^\s{4}Impact:\s*/, '').trim();
      else if (/^\s{4}Type:/.test(line)) meta.type = line.replace(/^\s{4}Type:\s*/, '').trim();
      else if (/^\s{4}WCAG:/.test(line)) meta.wcag = line.replace(/^\s{4}WCAG:\s*/, '').trim();
      else if (/^\s{4}EN:/.test(line)) {
        meta.en = line.replace(/^\s{4}EN:\s*/, '').trim();
        metaEnd = i + 1;
        break;
      }
    }

    // Splits resterende tekst in body en oplossing
    const remaining = lines.slice(metaEnd, end).join('\n');

    let body, solution;
    const oplossingMatch = remaining.match(/\nOplossing\s*\n/);
    if (oplossingMatch) {
      const idx = oplossingMatch.index;
      body = remaining.slice(0, idx).trim();
      solution = remaining.slice(idx + oplossingMatch[0].length).trim();
    } else {
      body = remaining.trim();
      solution = '';
    }

    // Converteer standalone afbeeldingsbestanden naar figure-elementen
    body = body.replace(
      /^([a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp))\s*$/gm,
      '<figure class="screenshot">\n<img src="images/$1" alt="">\n</figure>'
    );

    // Bepaal type beperking en richtlijn op basis van WCAG SC
    const beperking = lookupBeperkingen(meta.wcag);
    const richtlijn = lookupRichtlijn(meta.wcag);

    // Bouw de geformateerde bevinding
    let issueHtml = '\n<div class="issue">\n\n';
    issueHtml += `### ${title}\n\n`;
    issueHtml += '<div class="meta">  \n';
    issueHtml += `\t<span class="impact"><b>Impact</b>: ${meta.impact}</span>  \n`;
    issueHtml += `\t<span class="type"><b>Type</b>: ${meta.type}</span>  \n`;
    issueHtml += `\t<span class="type"><b>WCAG</b>: ${meta.wcag}</span>  \n`;
    issueHtml += `\t<span class="type"><b>EN</b>: ${meta.en}</span>  \n`;
    issueHtml += '</div>\n';
    if (richtlijn || beperking) {
      const parts = [];
      if (richtlijn) parts.push(`<b>Richtlijn</b>: ${richtlijn}`);
      if (beperking) parts.push(`<b>Beperking</b>: ${beperking}`);
      issueHtml += `\n<p class="beperking">${parts.join(' · ')}</p>\n\n`;
    } else {
      issueHtml += '\n';
    }
    issueHtml += body + '\n\n';
    if (solution) {
      issueHtml += '#### Oplossing:\n\n';
      issueHtml += solution + '\n\n';
    }
    issueHtml += '</div>';

    result.push(issueHtml);
  }

  return result.join('\n').trim();
}

/**
 * Split een enkel .md bestand in genummerde issue-bestanden.
 * @param {string} inputFilePath - Absoluut pad naar het bron .md bestand
 * @param {string} outputDir - Absoluut pad naar de map om bestanden in te schrijven
 * @returns {{ sectionCount: number, files: string[] }}
 */
function splitMarkdown(inputFilePath, outputDir) {
  const markdown = fs.readFileSync(inputFilePath, 'utf8');
  const startIndex = markdown.indexOf('# Bevindingen');
  if (startIndex === -1) {
    throw new Error("Geen '# Bevindingen' gevonden in het document.");
  }

  const relevantContent = markdown.slice(startIndex);
  const contentWithoutHeading = relevantContent
    .replace(/^#\s*Bevindingen.*$/m, '')
    .trim();

  const sections = contentWithoutHeading.split(/^##\s+/gm).filter(Boolean);
  const files = [];

  sections.forEach((section, i) => {
    const [titleLine, ...contentLines] = section.split('\n');
    const rawTitle = cleanContent(titleLine.trim());
    const index = String(i + 1).padStart(2, '0');
    const numberedTitle = `${index} ${rawTitle}`;
    const slug = slugify(rawTitle);

    const fileName = `${index}.${slug || 'section_' + index}.md`;
    const filePath = path.join(outputDir, fileName);

    const cleanedBody = formatIssues(
      cleanContent(contentLines.join('\n'))
    );

    const outputContent = `---
title: "${numberedTitle}"
order: ${i + 1}
---

${cleanedBody}
`;

    fs.writeFileSync(filePath, outputContent, 'utf8');
    files.push(fileName);
  });

  return { sectionCount: sections.length, files };
}

module.exports = { splitMarkdown, slugify, cleanContent, wrapIssues, formatIssues };
