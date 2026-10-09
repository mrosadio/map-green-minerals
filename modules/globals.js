// Set up dimensions and projection
// In your draw function, read actual dimensions:
// const mapEl = document.querySelector("#map");
// const width = mapEl.clientWidth;
// const height = mapEl.clientHeight;

// svg
//   .attr("viewBox", `0 0 ${W} ${H}`)
//   .attr("width", "100%")
//   .attr("height", "100%");
const width = 1200;
const height = 1000;
// Use the theme URL from the global variable set in template.php
const themeUrl = window.THEME_URL || ".";
const worldGeojsonPath = `${themeUrl}/db/world.geojson`;
const jsonFilePath = `${themeUrl}/db/bilateralPartner.json`;
const multiJsonFilePath = `${themeUrl}/db/multiPartner.json`;
const noPartnerFilePath = `${themeUrl}/db/numberPartner.json`;
const legendWidth = 50;
const legendHeight = 10;
const legendMargin = { top: 20, right: 20, bottom: 40, left: 10 };

// Initialize the SVG and append to #map
let svg = d3
  .select("#map")
  .append("svg")
  .attr("preserveAspectRatio", "xMidYMid meet")
  .attr("height", "100%") 
  .attr("width", "100%");

// Export the variables
export { width, height, svg, worldGeojsonPath, jsonFilePath, multiJsonFilePath, noPartnerFilePath, legendWidth, legendHeight, legendMargin, themeUrl };
