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

  // === Nummering toevoegen aan <h3> binnen #issues ===
  let teller = 1;
  const issueHeaders = document.querySelectorAll("#issues h3");

  issueHeaders.forEach((header) => {
    const tekst = header.textContent.trim();

    // Voeg nummering toe alleen als nog geen "Issue nr." prefix aanwezig is
    if (!/^Issue nr\.\s*\d+\s*-\s*/.test(tekst)) {
      header.textContent = `Issue nr. ${teller} - ${tekst}`;
      teller++;
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const exportBtn = document.getElementById("exportCsvBtn");
  if (!exportBtn) return;

  exportBtn.addEventListener("click", function () {
    const csvRows = [
      [
        "Pagina",
        "Issue",
        "WCAG",
        "Impact",
        "Type",
        "Beschrijving",
        "Oplossing",
      ],
    ];

    // Alle artikelen met class "issue"
    const issues = document.querySelectorAll("article.issue");

    issues.forEach((article) => {
      const pageTitle =
        article.querySelector("h2.issue-title")?.textContent.trim() || "";
      let currentIssue = "";
      let beschrijving = "";
      let oplossing = "";
      let type = "";
      let impact = "";
      let wcag = "";

      // alle children van dit article doorlopen
      const nodes = Array.from(
        article.querySelectorAll("h3, h4, p, figure, div.meta"),
      );

      let parsingOplossing = false;

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
              beschrijving.trim(),
              oplossing.trim(),
            ]);
            beschrijving = "";
            oplossing = "";
            type = "";
            impact = "";
            wcag = "";
            parsingOplossing = false;
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
                .replace(/Impact\s*:?\s*/i, "")
                .trim();
            }
            if (typeSpan) {
              type = typeSpan.textContent.replace(/Type\s*:?\s*/i, "").trim();
            }
            if (wcagSpan) {
              wcag = wcagSpan.textContent.replace(/WCAG\s*:?\s*/i, "").trim();
            }
          } else if (
            el.tagName === "H4" &&
            el.textContent.trim().toLowerCase().startsWith("oplossing")
          ) {
            parsingOplossing = true;
          } else if (el.tagName === "P" || el.tagName === "FIGURE") {
            if (parsingOplossing) {
              oplossing += el.innerText.trim() + " ";
            } else {
              beschrijving += el.innerText.trim() + " ";
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
          beschrijving.trim(),
          oplossing.trim(),
        ]);
      }
    });

    if (csvRows.length === 1) {
      alert("Geen bevindingen gevonden.");
      return;
    }

    const csvContent = csvRows
      .map((e) => e.map((f) => `"${f.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "bevindingen.csv");
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

  /* =========================================================
     1️⃣ Lees TYPE en IMPACT exact uit de DOM
  ========================================================= */
  issues.forEach((issue) => {
    // TYPE
    const typeSpan = issue.querySelector(".meta .type");
    if (typeSpan) {
      const text = typeSpan.textContent.toLowerCase();
      issue.dataset.type = text.includes("techniek")
        ? "techniek"
        : text.includes("content")
          ? "content"
          : "unknown";
    } else {
      issue.dataset.type = "unknown";
    }

    // IMPACT
    const impactSpan = issue.querySelector(".meta .impact");
    if (impactSpan) {
      const impactText = impactSpan.textContent
        .replace(/impact\s*:\s*/i, "")
        .trim()
        .toLowerCase();

      const allowed = ["groot", "medium", "klein", "advies"];
      issue.dataset.impact = allowed.includes(impactText)
        ? impactText
        : "unknown";
    } else {
      issue.dataset.impact = "unknown";
    }
  });

  /* =========================================================
     2️⃣ Tel LOGISCH (los van filters)
  ========================================================= */
  function updateCounts() {
    const typeCounts = {
      all: issues.length,
      techniek: 0,
      content: 0,
    };

    const impactCounts = {
      all: issues.length,
      groot: 0,
      medium: 0,
      klein: 0,
      advies: 0,
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
     3️⃣ Pas filters toe (OF type, OF impact)
  ========================================================= */
  function applyFilters() {
    let visible = 0;

    issues.forEach((issue) => {
      let show = true;

      if (activeType !== "all") {
        show = issue.dataset.type === activeType;
      } else if (activeImpact !== "all") {
        show = issue.dataset.impact === activeImpact;
      }

      issue.hidden = !show;
      if (show) visible++;
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
     6️⃣ Init
  ========================================================= */
  updateCounts();
  applyFilters();
});
