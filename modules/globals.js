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
const geojsonUrl =
  "https://raw.githubusercontent.com/Afripoli/D3-graph-gallery/refs/heads/master/DATA/world.geojson";
const jsonFilePath = `${themeUrl}/db/bilateralPartner.json`;
const multiJsonFilePath = "/db/multiPartner.json"; // Path to your multilateral partnership data
const noPartnerFilePath = "/db/numberPartner.json";
const legendWidth = 50;
const legendHeight = 10;
const legendMargin = { top: 20, right: 20, bottom: 40, left: 10 };

// Initialize the SVG and append to #map
let svg = d3
  .select("#map")
  .append("svg")
  .attr("viewBox", `-100 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet")
  .attr("height", "100%") // Altura fija
  .attr("width", "100%"); // Altura fija

const customColors = [
  "#fcc12c",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#d62728",
  "#bcbd22",
  "#17becf",
  "#aec7e8",
  "#ffbb78",
  "#98df8a",
  "#ff9896",
  "#c5b0d5",
  "#c49c94",
  "#f7b6d2",
  "#c75b38",
  "#dbdb8d",
  "#9edae5",
];
const blocColors = {
  "BRICS Geological Platform": "#fcc12c", // Blue
  "Minerals Security Partnership": "#fcc12c", // Orange
  "EU Raw Materials Club": "#fcc12c", // Green
  "Energy Resource Governance Initiative": "#fcc12c", // Red
  "Indo-Pacific Economic Framework for Prosperity (IPEF) Critical Minerals Dialogue": "#fcc12c", // Purple
  "Sustainable Critical Mineral Alliance": "#fcc12c",
  "Conference on Critical Materials and Minerals": "#fcc12c",
  "France-Germany-Italy Joint Communique on Critical Raw Materials": "#fcc12c",
  "Critical Minerals Mapping Initiative": "#fcc12c",
  "Lobito Corridor Project": "#fcc12c",
};

// Export the variables
export {
  width,
  height,
  svg,
  customColors,
  blocColors,
  geojsonUrl,
  jsonFilePath,
  multiJsonFilePath,
  noPartnerFilePath,
  legendWidth,
  legendHeight,
  legendMargin,
  themeUrl,
};
