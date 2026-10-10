// Data file paths are relative to the page, so they work on localhost and on GitHub Pages alike
const worldGeojsonPath = "./db/world.geojson";
const jsonFilePath = "./db/bilateralPartner.json";
const multiJsonFilePath = "./db/multiPartner.json";
const noPartnerFilePath = "./db/numberPartner.json";

// The map's SVG: created once here, sized and redrawn by the functions in mapUtils.js
const svg = d3.select("#map").append("svg").attr("preserveAspectRatio", "xMidYMid meet").attr("height", "100%").attr("width", "100%");

export { svg, worldGeojsonPath, jsonFilePath, multiJsonFilePath, noPartnerFilePath };
