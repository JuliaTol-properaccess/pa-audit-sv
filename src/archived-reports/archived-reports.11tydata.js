module.exports = {
  sourceDir: "src/archived-reports",
  eleventyComputed: {
    permalink: (data) => {
      // Alleen index.njk bestanden krijgen een aangepaste permalink
      if (data.page.inputPath.endsWith("index.njk")) {
        return `/${data.page.fileSlug}/index.html`;
      }
      // .md issue-bestanden: geen eigen pagina genereren
      return false;
    },
  },
};
