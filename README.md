# WCAG Rapportage Tool

Eleventy-gebaseerde tool voor het genereren van WCAG-toegankelijkheidsrapporten.

## Rapport maken

### 1. Google Docs-export klaarzetten

Exporteer het rapport vanuit Google Docs als Markdown (.md) en plaats het bestand in `.tmp/`:

```bash
# Optie A: bestand in .tmp/ plaatsen (het script pakt het eerste .md bestand)
cp ~/Downloads/rapport.md .tmp/

# Optie B: bestand direct meegeven (handig als er meerdere bestanden in .tmp/ staan)
node tools/create-report.js .tmp/rapport.md
```

### 2. Rapport genereren

```bash
node tools/create-report.js
```

Dit script vraagt om de rapportgegevens, splitst het Google Docs-export en scaffoldt de rapportmap.

Controleer daarna handmatig:

- `result.md` — vul de "meest opvallende bevindingen" aan
- `images/opdrachtgever.png` — vervang het logo van de opdrachtgever

### 3. Bouwen en controleren

Nu doet `npm run dev` automatisch:

Bouwen

- Statistieken genereren
- Dev server starten op http://localhost:1337/

Open het rapport in de browser en controleer of alles klopt.

### 4. Committen en pushen

```bash
git add src/reports/202603_clientnaam/
git commit -m "Rapport 202603 clientnaam"
git push
```

GitHub Actions bouwt automatisch en deployt naar GitHub Pages.
https://github.com/JuliaTol-properaccess/pa-audit/settings/pages

### 5. Controleer of het rapport live staat

Overzicht van alle rapporten: https://audit2026.properaccess.nl/

Een individueel rapport: `https://audit2026.properaccess.nl/202603_clientnaam/`

### 6. Lokaal opruimen

```bash
rm -rf src/reports/202603_clientnaam/
git add -u
git commit -m "Rapport 202603 clientnaam opgeleverd, bronbestanden verwijderd"
git push
```

De bronbestanden staan veilig op GitHub in de Git-geschiedenis. Je kunt ze altijd terughalen:

```bash
git checkout main -- src/reports/202603_clientnaam/
```

## Git LFS

Afbeeldingen in `src/reports/*/images/` worden via Git LFS opgeslagen. Dit voorkomt dat de repo opgeblazen wordt door binaire bestanden.

## Tooling aanpassen

```bash
git checkout -b feature/omschrijving
# Wijzigingen maken
git commit -m "Beschrijving van de wijziging"
git push -u origin feature/omschrijving
```

Open een Pull Request op GitHub en merge naar `main`.

## Rapport versturen

Onderwerp: Audit digitale toegankelijkheid is klaar

Beste [Naam],

De audit van de digitale toegankelijkheid van je website is afgerond.HTML-versie van het rapport: [LINK].

We hebben ons rapport flink verbeterd.
Elk kopje van een bevinding is nu een link. Heb je vragen over een bevinding? Kopieer de link en stuur deze samen met je vraag naar contact@properaccess.nl.

Bij elke bevinding heb ik nu het type beperking toegevoegd. Dit helpt te begrijpen voor wie het probleem een barrière vormt.

Bij elke bevinding heb ik de richtlijn van WCAG toegevoegd. Nu heb je een beter beeld van het type barrière (bezoeker kan dit niet waarnemen, niet bedienen, niet begrijpen of de code is niet robuust).

Het rapport bevat nu filters om de bevindingen te filteren per type issue en impact. Handig als je dit rapport met je contentteam of je devteam bespreekt. Met de filter Impact kun je meteen beginnen met de grootste issues.

Voor klanten waar één persoon dit project beheert, heb ik een mechanisme toegevoegd om de voortgang van de opgeloste bevindingen in de browser te bewaken. Deze informatie wordt opgeslagen in de browser en kan niet met collega's worden gedeeld.