const fs = require("fs");

function sampleImage(id, report) {
  const basePath = `./src/reports/${report}/images/`;
  const pngPath = `${basePath}${id}.png`;
  const jpgPath = `${basePath}${id}.jpg`;

  if (fs.existsSync(pngPath)) {
    return `images/${id}.png`;
  } else if (fs.existsSync(jpgPath)) {
    return `images/${id}.jpg`;
  } else {
    return "../example/images/default-screenshot.png";
  }
}

module.exports = sampleImage;

