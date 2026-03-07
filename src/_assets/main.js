document.addEventListener("DOMContentLoaded", function () {
  // === Scroll-observer voor sidebar navigatie ===
  const sections = document.querySelectorAll("article");
  const navLinks = document.querySelectorAll(".sidebar a");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => link.classList.remove("active"));
          const id = entry.target.getAttribute("id");
          const activeLink = document.querySelector(
            `.sidebar a[href="#${id}"]`,
          );
          if (activeLink) {
            activeLink.classList.add("active");
          }
        }
      });
    },
    { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
  );

  sections.forEach((section) => observer.observe(section));

  // === Paginatitel linken naar externe URL ===
  document.querySelectorAll("#issues > article.issue").forEach((article) => {
    const paragraphs = article.querySelectorAll("p");
    for (const p of paragraphs) {
      const text = p.textContent.trim();
      if (text.startsWith("Länk till sidan:")) {
        const link = p.querySelector("a");
        if (!link) continue;
        const url = link.href;

        // Update h2 title link to point to external URL
        const titleLink = article.querySelector("h2.issue-title a");
        if (titleLink) {
          titleLink.href = url;
          titleLink.target = "_blank";
          titleLink.rel = "noopener";
          // Replace link icon with external link SVG
          const icon = titleLink.querySelector(".fa-link");
          if (icon) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 16 16");
            svg.setAttribute("width", "12");
            svg.setAttribute("height", "12");
            svg.setAttribute("aria-hidden", "true");
            svg.setAttribute("class", "icon-external");
            svg.innerHTML = '<path fill="currentColor" d="M9 1h6v6h-2V4.4L7.7 9.7 6.3 8.3 11.6 3H9V1zM3 3h4v2H3v8h8V9h2v6H1V3h2z"/>';
            icon.replaceWith(svg);
          }
        }

        // Hide the "Länk till sidan" paragraph
        p.hidden = true;
        break;
      }
    }
  });

  // === Nummering toevoegen aan <h3> binnen #issues ===
  let teller = 1;
  const issueHeaders = document.querySelectorAll("#issues h3");

  issueHeaders.forEach((header) => {
    const tekst = header.textContent.trim();

    if (!/^Issue nr\.\s*\d+\s*-\s*/.test(tekst)) {
      header.textContent = `Issue nr. ${teller} - ${tekst}`;
      teller++;
    }
  });

  // === Permalink-links toevoegen aan h3's binnen .issue ===
  let issueCounter = 0;
  document.querySelectorAll("#issues .issue h3").forEach((header) => {
    issueCounter++;
    const nrMatch = header.textContent.match(/Issue nr\.\s*(\d+)/);
    const issueNr = nrMatch ? nrMatch[1] : issueCounter;
    const anchorId = "issue-" + issueNr;

    // Set ID on parent div.issue for anchor scrolling
    const parentIssue = header.closest("div.issue");
    if (parentIssue) parentIssue.id = anchorId;
    header.id = anchorId + "-h3";

    const text = header.textContent;
    header.textContent = "";

    const link = document.createElement("a");
    link.href = `#${anchorId}`;
    link.textContent = text;

    const btn = document.createElement("button");
    btn.className = "permalink-btn";
    btn.dataset.anchor = anchorId;
    btn.title = "Kopiera länk till detta fynd";
    btn.setAttribute("aria-label", "Kopiera länk till fynd " + issueNr);
    btn.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M7.8 11.1l-1.9 1.9a2 2 0 0 1-2.8-2.8l2.8-2.8a2 2 0 0 1 2.8 0 .7.7 0 0 0 1-1 3.4 3.4 0 0 0-4.8 0L2.1 9.2a3.4 3.4 0 0 0 4.8 4.8l1.9-1.9a.7.7 0 0 0-1-1zm6.1-8.2a3.4 3.4 0 0 0-4.8 0L7.2 4.8a.7.7 0 0 0 1 1l1.9-1.9a2 2 0 0 1 2.8 2.8l-2.8 2.8a2 2 0 0 1-2.8 0 .7.7 0 0 0-1 1 3.4 3.4 0 0 0 4.8 0l2.8-2.8a3.4 3.4 0 0 0 0-4.8z"/></svg>';
    link.appendChild(btn);

    header.appendChild(link);
  });

  // === WCAG principe, niveau + type beperking toevoegen aan meta ===
  const wcagData = {
    // Princip 1: Möjlig att uppfatta
    "1.1.1": { princip: "Möjlig att uppfatta", nivå: "A", funktionsnedsättning: ["Visuell"] },
    "1.2.1": { princip: "Möjlig att uppfatta", nivå: "A", funktionsnedsättning: ["Visuell", "Auditiv"] },
    "1.2.2": { princip: "Möjlig att uppfatta", nivå: "A", funktionsnedsättning: ["Auditiv"] },
    "1.2.3": { princip: "Möjlig att uppfatta", nivå: "A", funktionsnedsättning: ["Visuell"] },
    "1.2.4": { princip: "Möjlig att uppfatta", nivå: "AA", funktionsnedsättning: ["Auditiv"] },
    "1.2.5": { princip: "Möjlig att uppfatta", nivå: "AA", funktionsnedsättning: ["Visuell"] },
    "1.3.1": { princip: "Möjlig att uppfatta", nivå: "A", funktionsnedsättning: ["Visuell"] },
    "1.3.2": { princip: "Möjlig att uppfatta", nivå: "A", funktionsnedsättning: ["Visuell"] },
    "1.3.3": { princip: "Möjlig att uppfatta", nivå: "A", funktionsnedsättning: ["Visuell"] },
    "1.3.4": { princip: "Möjlig att uppfatta", nivå: "AA", funktionsnedsättning: ["Motorisk"] },
    "1.3.5": { princip: "Möjlig att uppfatta", nivå: "AA", funktionsnedsättning: ["Kognitiv", "Motorisk"] },
    "1.4.1": { princip: "Möjlig att uppfatta", nivå: "A", funktionsnedsättning: ["Visuell"] },
    "1.4.2": { princip: "Möjlig att uppfatta", nivå: "A", funktionsnedsättning: ["Auditiv", "Kognitiv"] },
    "1.4.3": { princip: "Möjlig att uppfatta", nivå: "AA", funktionsnedsättning: ["Visuell"] },
    "1.4.4": { princip: "Möjlig att uppfatta", nivå: "AA", funktionsnedsättning: ["Visuell"] },
    "1.4.5": { princip: "Möjlig att uppfatta", nivå: "AA", funktionsnedsättning: ["Visuell"] },
    "1.4.10": { princip: "Möjlig att uppfatta", nivå: "AA", funktionsnedsättning: ["Visuell"] },
    "1.4.11": { princip: "Möjlig att uppfatta", nivå: "AA", funktionsnedsättning: ["Visuell"] },
    "1.4.12": { princip: "Möjlig att uppfatta", nivå: "AA", funktionsnedsättning: ["Visuell", "Kognitiv"] },
    "1.4.13": { princip: "Möjlig att uppfatta", nivå: "AA", funktionsnedsättning: ["Visuell", "Motorisk"] },
    // Princip 2: Hanterbar
    "2.1.1": { princip: "Hanterbar", nivå: "A", funktionsnedsättning: ["Motorisk"] },
    "2.1.2": { princip: "Hanterbar", nivå: "A", funktionsnedsättning: ["Motorisk"] },
    "2.1.4": { princip: "Hanterbar", nivå: "A", funktionsnedsättning: ["Motorisk"] },
    "2.2.1": { princip: "Hanterbar", nivå: "A", funktionsnedsättning: ["Visuell", "Motorisk", "Kognitiv"] },
    "2.2.2": { princip: "Hanterbar", nivå: "A", funktionsnedsättning: ["Visuell", "Kognitiv"] },
    "2.3.1": { princip: "Hanterbar", nivå: "A", funktionsnedsättning: ["Visuell"] },
    "2.4.1": { princip: "Hanterbar", nivå: "A", funktionsnedsättning: ["Motorisk"] },
    "2.4.2": { princip: "Hanterbar", nivå: "A", funktionsnedsättning: ["Visuell", "Kognitiv"] },
    "2.4.3": { princip: "Hanterbar", nivå: "A", funktionsnedsättning: ["Motorisk"] },
    "2.4.4": { princip: "Hanterbar", nivå: "A", funktionsnedsättning: ["Visuell", "Kognitiv"] },
    "2.4.5": { princip: "Hanterbar", nivå: "AA", funktionsnedsättning: ["Kognitiv"] },
    "2.4.6": { princip: "Hanterbar", nivå: "AA", funktionsnedsättning: ["Visuell", "Kognitiv"] },
    "2.4.7": { princip: "Hanterbar", nivå: "AA", funktionsnedsättning: ["Motorisk"] },
    "2.4.11": { princip: "Hanterbar", nivå: "AA", funktionsnedsättning: ["Motorisk"] },
    "2.5.1": { princip: "Hanterbar", nivå: "A", funktionsnedsättning: ["Motorisk"] },
    "2.5.2": { princip: "Hanterbar", nivå: "A", funktionsnedsättning: ["Motorisk"] },
    "2.5.3": { princip: "Hanterbar", nivå: "A", funktionsnedsättning: ["Motorisk", "Visuell"] },
    "2.5.4": { princip: "Hanterbar", nivå: "A", funktionsnedsättning: ["Motorisk"] },
    "2.5.7": { princip: "Hanterbar", nivå: "AA", funktionsnedsättning: ["Motorisk"] },
    "2.5.8": { princip: "Hanterbar", nivå: "AA", funktionsnedsättning: ["Motorisk"] },
    // Princip 3: Begriplig
    "3.1.1": { princip: "Begriplig", nivå: "A", funktionsnedsättning: ["Visuell"] },
    "3.1.2": { princip: "Begriplig", nivå: "AA", funktionsnedsättning: ["Visuell"] },
    "3.2.1": { princip: "Begriplig", nivå: "A", funktionsnedsättning: ["Kognitiv", "Motorisk"] },
    "3.2.2": { princip: "Begriplig", nivå: "A", funktionsnedsättning: ["Kognitiv"] },
    "3.2.3": { princip: "Begriplig", nivå: "AA", funktionsnedsättning: ["Kognitiv"] },
    "3.2.4": { princip: "Begriplig", nivå: "AA", funktionsnedsättning: ["Kognitiv"] },
    "3.2.6": { princip: "Begriplig", nivå: "A", funktionsnedsättning: ["Kognitiv"] },
    "3.3.1": { princip: "Begriplig", nivå: "A", funktionsnedsättning: ["Visuell", "Kognitiv"] },
    "3.3.2": { princip: "Begriplig", nivå: "A", funktionsnedsättning: ["Kognitiv"] },
    "3.3.3": { princip: "Begriplig", nivå: "AA", funktionsnedsättning: ["Kognitiv"] },
    "3.3.4": { princip: "Begriplig", nivå: "AA", funktionsnedsättning: ["Kognitiv"] },
    "3.3.7": { princip: "Begriplig", nivå: "A", funktionsnedsättning: ["Kognitiv", "Motorisk"] },
    "3.3.8": { princip: "Begriplig", nivå: "AA", funktionsnedsättning: ["Kognitiv"] },
    // Princip 4: Robust
    "4.1.2": { princip: "Robust", nivå: "A", funktionsnedsättning: ["Visuell"] },
    "4.1.3": { princip: "Robust", nivå: "AA", funktionsnedsättning: ["Visuell"] },
  };

  document.querySelectorAll("#issues .meta").forEach((meta) => {
    const wcagSpan = Array.from(meta.querySelectorAll("span")).find((s) => {
      const b = s.querySelector("b");
      return b && b.textContent.trim() === "WCAG";
    });
    if (!wcagSpan) return;

    const numbers = wcagSpan.textContent
      .replace(/WCAG\s*:?\s*/, "")
      .split(/[\s,]+/)
      .filter(Boolean);

    const principer = new Set();
    const nivåer = new Set();
    const funktionsnedsättningar = new Set();

    numbers.forEach((num) => {
      const data = wcagData[num];
      if (data) {
        principer.add(data.princip);
        nivåer.add(data.nivå);
        data.funktionsnedsättning.forEach((b) => funktionsnedsättningar.add(b));
      }
    });

    if (principer.size > 0) {
      const span = document.createElement("span");
      span.className = "type richtlijn";
      span.innerHTML = `<b>Princip</b>: ${[...principer].join(", ")}`;
      meta.appendChild(span);
    }

    if (nivåer.size > 0) {
      const span = document.createElement("span");
      span.className = "type";
      span.innerHTML = `<b>Nivå</b>: ${[...nivåer].sort().join(", ")}`;
      meta.appendChild(span);
    }

    if (funktionsnedsättningar.size > 0) {
      const span = document.createElement("span");
      span.className = "type beperking";
      span.innerHTML = `<b>Funktionsnedsättning</b>: ${[...funktionsnedsättningar].join(", ")}`;
      meta.appendChild(span);
    }
  });

  // === Permalink kopiëren bij klik op permalink-btn ===
  document.querySelectorAll(".permalink-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const anchor = btn.dataset.anchor;
      const url = location.origin + location.pathname + "#" + anchor;
      navigator.clipboard.writeText(url).then(() => {
        history.replaceState(null, "", "#" + anchor);
        const tip = document.createElement("span");
        tip.className = "copy-tooltip";
        tip.textContent = "Länk kopierad!";
        btn.style.position = "relative";
        btn.appendChild(tip);
        setTimeout(() => tip.remove(), 2000);
      });
    });
  });

  // Open and scroll to issue if URL has hash
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) {
      setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const exportBtn = document.getElementById("exportCsvBtn");
  if (!exportBtn) return;

  exportBtn.addEventListener("click", function () {
    const csvRows = [
      [
        "Sida",
        "Problem",
        "WCAG",
        "Påverkan",
        "Typ",
        "Beskrivning",
        "Lösning",
      ],
    ];

    // Alle artikelen met class "issue"
    const issues = document.querySelectorAll("article.issue");

    issues.forEach((article) => {
      const pageTitle =
        article.querySelector("h2.issue-title")?.textContent.trim() || "";
      let currentIssue = "";
      let beskrivning = "";
      let lösning = "";
      let type = "";
      let impact = "";
      let wcag = "";

      // alle children van dit article doorlopen
      const nodes = Array.from(
        article.querySelectorAll("h3, h4, p, figure, div.meta"),
      );

      let parsingLösning = false;

      nodes.forEach((el) => {
        if (el.tagName === "H3") {
          // Nieuwe issue titel
          if (currentIssue) {
            csvRows.push([
              pageTitle,
              currentIssue,
              wcag,
              impact,
              type,
              beskrivning.trim(),
              lösning.trim(),
            ]);
            beskrivning = "";
            lösning = "";
            type = "";
            impact = "";
            wcag = "";
            parsingLösning = false;
          }
          currentIssue = el.textContent.trim();
        }

        if (currentIssue) {
          if (el.tagName === "DIV" && el.classList.contains("meta")) {
            const impactSpan = el.querySelector(".impact");
            const typeSpan = el.querySelector(".type");
            // WCAG staat ook als span met "type content" class, maar met tekst "WCAG"
            const wcagSpan = Array.from(el.querySelectorAll("span")).find((s) =>
              s.textContent.includes("WCAG"),
            );
            if (impactSpan) {
              impact = impactSpan.textContent
                .replace(/Påverkan\s*:?\s*/i, "")
                .trim();
            }
            if (typeSpan) {
              type = typeSpan.textContent.replace(/Typ\s*:?\s*/i, "").trim();
            }
            if (wcagSpan) {
              wcag = wcagSpan.textContent.replace(/WCAG\s*:?\s*/i, "").trim();
            }
          } else if (
            el.tagName === "H4" &&
            el.textContent.trim().toLowerCase().startsWith("lösning")
          ) {
            parsingLösning = true;
          } else if (el.tagName === "P" || el.tagName === "FIGURE") {
            if (parsingLösning) {
              lösning += el.innerText.trim() + " ";
            } else {
              beskrivning += el.innerText.trim() + " ";
            }
          }
        }
      });

      // laatste issue in dit artikel toevoegen
      if (currentIssue) {
        csvRows.push([
          pageTitle,
          currentIssue,
          wcag,
          impact,
          type,
          beskrivning.trim(),
          lösning.trim(),
        ]);
      }
    });

    if (csvRows.length === 1) {
      alert("Inga fynd hittades.");
      return;
    }

    const csvContent = csvRows
      .map((e) => e.map((f) => `"${f.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "fynd.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});

// Filter bevindingen
document.addEventListener("DOMContentLoaded", () => {
  const issues = Array.from(document.querySelectorAll("#issues .issue"));

  // --- Type filters ---
  const typeButtons = document.querySelectorAll(".filter-btn");
  const typeCounters = document.querySelectorAll(".count");

  // --- Impact filters ---
  const impactButtons = document.querySelectorAll(".impact-btn");
  const impactCounters = document.querySelectorAll(".impact-count");

  const noResults = document.getElementById("no-results");

  let activeType = "all";
  let activeImpact = "all";
  let activeStatus = "all";

  /* =========================================================
     1️⃣ Lees TYPE en IMPACT exact uit de DOM
  ========================================================= */
  issues.forEach((issue) => {
    // TYPE
    const typeSpan = issue.querySelector(".meta .type");
    if (typeSpan) {
      const text = typeSpan.textContent.toLowerCase();
      issue.dataset.type = text.includes("teknik")
        ? "teknik"
        : text.includes("innehåll")
          ? "innehåll"
          : "unknown";
    } else {
      issue.dataset.type = "unknown";
    }

    // IMPACT
    const impactSpan = issue.querySelector(".meta .impact");
    if (impactSpan) {
      const impactText = impactSpan.textContent
        .replace(/påverkan\s*:\s*/i, "")
        .trim()
        .toLowerCase();

      const allowed = ["stor", "medel", "liten", "rekommendation"];
      issue.dataset.impact = allowed.includes(impactText)
        ? impactText
        : "unknown";
    } else {
      issue.dataset.impact = "unknown";
    }
  });

  /* =========================================================
     1b. Resolved state (localStorage)
  ========================================================= */
  const reportId = document.documentElement.dataset.reportId;

  function getResolvedState() {
    const raw = localStorage.getItem(`wcag-resolved-${reportId}`);
    if (!raw) return { version: 1, issues: {} };
    try { return JSON.parse(raw); } catch { return { version: 1, issues: {} }; }
  }

  function saveResolvedState(state) {
    localStorage.setItem(`wcag-resolved-${reportId}`, JSON.stringify(state));
  }

  const resolvedState = getResolvedState();

  // Groepeer: article.issue = paginaniveau, div.issue = individuele bevinding
  issues.forEach((issue) => {
    if (issue.tagName === "ARTICLE") {
      // Paginaniveau: checkbox "Hele pagina opgelost" in issue-meta
      const meta = issue.querySelector(".issue-meta");
      if (!meta) return;
      const nestedIssues = Array.from(issue.querySelectorAll(":scope > .issue"));
      const pageSlug = issue.id;
      if (!pageSlug || nestedIssues.length === 0) return;

      const label = document.createElement("label");
      label.className = "resolved-toggle resolved-toggle-page";
      label.hidden = true;
      label.title = "Markeer alle bevindingen op deze pagina als opgelost";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "resolved-checkbox";
      checkbox.setAttribute("aria-label", "Hela sidan är åtgärdad");

      const span = document.createElement("span");
      span.className = "resolved-label";
      span.innerHTML = '<i class="fa-solid fa-circle-check"></i> Hela sidan är åtgärdad';

      label.appendChild(checkbox);
      label.appendChild(span);
      meta.appendChild(label);

      // Check initial state: als alle nested issues opgelost zijn
      function updatePageCheckbox() {
        const allResolved = nestedIssues.every((ni) => ni.dataset.status === "åtgärdad");
        checkbox.checked = allResolved;
      }

      checkbox.addEventListener("change", () => {
        const state = getResolvedState();
        nestedIssues.forEach((ni) => {
          const niSlug = ni.id;
          const h3 = ni.querySelector("h3");
          if (!niSlug) return;
          const cb = ni.querySelector(".resolved-checkbox");
          if (checkbox.checked) {
            state.issues[niSlug] = true;
            ni.classList.add("is-resolved");
            ni.dataset.status = "åtgärdad";
            if (cb) cb.checked = true;
            if (h3 && !h3.querySelector(".sr-only")) {
              const srSpan = document.createElement("span");
              srSpan.className = "sr-only";
              srSpan.textContent = "(åtgärdad)";
              h3.appendChild(srSpan);
            }
          } else {
            delete state.issues[niSlug];
            ni.classList.remove("is-resolved");
            ni.dataset.status = "öppen";
            if (cb) cb.checked = false;
            const srSpan = h3 ? h3.querySelector(".sr-only") : null;
            if (srSpan) srSpan.remove();
          }
        });
        saveResolvedState(state);
        updateDashboard();
        applyFilters();
      });

      // Bewaar functie zodat individuele checkboxes de pagina-checkbox kunnen updaten
      issue._updatePageCheckbox = updatePageCheckbox;
      return;
    }

    // Individuele bevinding (div.issue)
    const h3 = issue.querySelector("h3");
    if (!h3) return;
    const slug = issue.id;
    if (!slug) return;

    // Set data-status
    issue.dataset.status = resolvedState.issues[slug] ? "åtgärdad" : "öppen";
    if (resolvedState.issues[slug]) {
      issue.classList.add("is-resolved");
      const srSpan = document.createElement("span");
      srSpan.className = "sr-only";
      srSpan.textContent = "(åtgärdad)";
      h3.appendChild(srSpan);
    }

    // Create toggle
    const label = document.createElement("label");
    label.className = "resolved-toggle";
    label.hidden = true;
    label.title = "Markera som åtgärdad";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "resolved-checkbox";
    checkbox.dataset.issueSlug = slug;
    checkbox.checked = !!resolvedState.issues[slug];
    checkbox.setAttribute("aria-label", "Detta problem är åtgärdat");

    const span = document.createElement("span");
    span.className = "resolved-label";
    span.innerHTML = '<i class="fa-solid fa-circle-check"></i> Detta problem är åtgärdat';

    label.appendChild(checkbox);
    label.appendChild(span);
    h3.after(label);

    checkbox.addEventListener("change", () => {
      const state = getResolvedState();
      if (checkbox.checked) {
        state.issues[slug] = true;
        issue.classList.add("is-resolved");
        issue.dataset.status = "åtgärdad";
        if (!h3.querySelector(".sr-only")) {
          const srSpan = document.createElement("span");
          srSpan.className = "sr-only";
          srSpan.textContent = "(åtgärdad)";
          h3.appendChild(srSpan);
        }
      } else {
        delete state.issues[slug];
        issue.classList.remove("is-resolved");
        issue.dataset.status = "öppen";
        const srSpan = h3.querySelector(".sr-only");
        if (srSpan) srSpan.remove();
      }
      saveResolvedState(state);
      updateDashboard();
      applyFilters();
      // Update pagina-checkbox
      const article = issue.closest("article.issue");
      if (article && article._updatePageCheckbox) article._updatePageCheckbox();
    });
  });

  // Init pagina-checkboxes
  document.querySelectorAll("#issues > article.issue").forEach((article) => {
    if (article._updatePageCheckbox) article._updatePageCheckbox();
  });

  /* =========================================================
     2️⃣ Tel LOGISCH (los van filters)
  ========================================================= */
  function updateCounts() {
    const typeCounts = {
      all: issues.length,
      teknik: 0,
      innehåll: 0,
    };

    const impactCounts = {
      all: issues.length,
      stor: 0,
      medel: 0,
      liten: 0,
      rekommendation: 0,
    };

    issues.forEach((issue) => {
      if (issue.dataset.type in typeCounts) {
        typeCounts[issue.dataset.type]++;
      }
      if (issue.dataset.impact in impactCounts) {
        impactCounts[issue.dataset.impact]++;
      }
    });

    typeCounters.forEach((counter) => {
      counter.textContent = typeCounts[counter.dataset.count] ?? 0;
    });

    impactCounters.forEach((counter) => {
      counter.textContent = impactCounts[counter.dataset.impactCount] ?? 0;
    });
  }

  /* =========================================================
     2b. Dashboard updaten
  ========================================================= */
  function updateDashboard() {
    const divIssues = issues.filter((i) => i.tagName !== "ARTICLE");
    const total = divIssues.length;
    const resolved = divIssues.filter((i) => i.dataset.status === "åtgärdad").length;
    const pct = total > 0 ? Math.round((resolved / total) * 100) : 0;

    document.querySelectorAll(".resolved-count").forEach((el) => el.textContent = resolved);
    document.querySelectorAll(".resolved-total").forEach((el) => el.textContent = total);
    document.querySelectorAll(".resolved-progress-fill").forEach((el) => el.style.width = `${pct}%`);
  }

  /* =========================================================
     3️⃣ Pas filters toe (type/impact + status)
  ========================================================= */
  function applyFilters() {
    let visible = 0;

    issues.forEach((issue) => {
      // Artikelen (pagina-containers) worden apart afgehandeld
      if (issue.tagName === "ARTICLE") return;

      let show = true;

      if (activeType !== "all") {
        show = issue.dataset.type === activeType;
      } else if (activeImpact !== "all") {
        show = issue.dataset.impact === activeImpact;
      }

      // Status als AND-conditie
      if (show && activeStatus !== "all") {
        show = issue.dataset.status === activeStatus;
      }

      issue.hidden = !show;
      if (show) visible++;
    });

    // Toon/verberg artikelen op basis van zichtbare kinderen
    document.querySelectorAll("#issues > article.issue").forEach((article) => {
      const hasVisible = article.querySelector("div.issue:not([hidden])");
      article.hidden = !hasVisible;
    });

    noResults.hidden = visible !== 0;
  }

  /* =========================================================
     4️⃣ Type-knoppen
  ========================================================= */
  typeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeType = btn.dataset.filter;
      activeImpact = "all";

      // UI reset impact
      impactButtons.forEach((b) => b.classList.remove("active"));
      impactButtons[0]?.classList.add("active");

      // UI active type
      typeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      applyFilters();
    });
  });

  /* =========================================================
     5️⃣ Impact-knoppen
  ========================================================= */
  impactButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeImpact = btn.dataset.impact;
      activeType = "all";

      // UI reset type
      typeButtons.forEach((b) => b.classList.remove("active"));
      typeButtons[0]?.classList.add("active");

      // UI active impact
      impactButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      applyFilters();
    });
  });

  /* =========================================================
     6️⃣ Status-knoppen
  ========================================================= */
  const statusButtons = document.querySelectorAll(".status-btn");

  statusButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeStatus = btn.dataset.status;

      statusButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      applyFilters();
    });
  });

  /* =========================================================
     7️⃣ Browser-tracking toggle
  ========================================================= */
  const trackingToggle = document.getElementById("browserTrackingToggle");
  const dashboardEl = document.getElementById("resolved-dashboard-issues");
  const statusFilterGroup = document.getElementById("status-filter-group");
  const allResolvedToggles = document.querySelectorAll(".resolved-toggle");

  function setTrackingEnabled(enabled) {
    // Dashboard
    if (dashboardEl) dashboardEl.hidden = !enabled;
    // Status filter
    if (statusFilterGroup) statusFilterGroup.hidden = !enabled;
    // Alle checkboxes bij issues
    allResolvedToggles.forEach((toggle) => toggle.hidden = !enabled);

    if (enabled) {
      updateDashboard();
    } else {
      // Reset status-filter naar "all" als tracking uit staat
      activeStatus = "all";
      statusButtons.forEach((b) => b.classList.remove("active"));
      statusButtons[0]?.classList.add("active");
    }
    applyFilters();
  }

  if (trackingToggle) {
    const trackingKey = `wcag-tracking-enabled-${reportId}`;
    const trackingEnabled = localStorage.getItem(trackingKey) === "true";
    trackingToggle.checked = trackingEnabled;
    setTrackingEnabled(trackingEnabled);

    trackingToggle.addEventListener("change", () => {
      localStorage.setItem(trackingKey, trackingToggle.checked);
      setTrackingEnabled(trackingToggle.checked);
    });
  }

  /* =========================================================
     8️⃣ Init
  ========================================================= */
  updateCounts();
  applyFilters();
});
