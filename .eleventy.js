const fs = require("fs");
const path = require("path");
const markdownShortcode = require("eleventy-plugin-markdown-shortcode");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const slugify = require("./src/_utils/slugify.js");

// Bronmappen voor rapporten (actief + archief)
const reportSources = ["src/reports", "src/archived-reports"];

// Verzamel alle rapportmappen uit alle bronnen
const allReports = [];
for (const relative of reportSources) {
  const absolute = path.join(__dirname, relative);
  if (!fs.existsSync(absolute)) continue;
  const dirs = fs
    .readdirSync(absolute)
    .filter((name) => fs.lstatSync(path.join(absolute, name)).isDirectory());
  for (const name of dirs) {
    allReports.push({ name, relative });
  }
}

module.exports = function (eleventyConfig) {
  // Plugins & filters
  eleventyConfig.addPlugin(markdownShortcode);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addFilter("slugify", slugify);

  // URL-filter
  eleventyConfig.addFilter("url", (url, pathPrefix = "/") => {
    if (!url) return pathPrefix + "/";
    if (!pathPrefix.endsWith("/")) pathPrefix += "/";
    if (url.startsWith("/")) url = url.substring(1);
    return pathPrefix + url;
  });

  // Layout-alias
  eleventyConfig.addLayoutAlias("report", "report.njk");

  // Kopieer assets
  eleventyConfig.addPassthroughCopy("src/_assets");
  eleventyConfig.addPassthroughCopy("src/CNAME");

  // Kopieer rapport-afbeeldingen naar de juiste output-map (zonder /reports/)
  for (const { name, relative } of allReports) {
    eleventyConfig.addPassthroughCopy({
      [`${relative}/${name}/images`]: `${name}/images`,
    });
  }

  // Draai generate-summary.js automatisch na elke build
  eleventyConfig.on("eleventy.after", () => {
    const { execSync } = require("child_process");
    execSync("node generate-summary.js", { cwd: __dirname, stdio: "inherit" });
  });

  // Maak een collectie per rapport
  for (const { name, relative } of allReports) {
    eleventyConfig.addCollection(name, (collectionApi) =>
      collectionApi
        .getFilteredByGlob(`${relative}/${name}/**/*.md`)
        .filter((item) => item.data.title)
        .sort((a, b) => {
          const titleA = (a.data.title || "").toLowerCase();
          const titleB = (b.data.title || "").toLowerCase();
          return titleA.localeCompare(titleB);
        })
    );
  }


  return {
    pathPrefix: "/pa-audit-sv/",
    dir: {
      input: "src",
      output: "dist",
      includes: "_layouts",
      data: "_data",
      layouts: "_layouts",
    },
    templateFormats: ["njk", "md", "html", "css"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};