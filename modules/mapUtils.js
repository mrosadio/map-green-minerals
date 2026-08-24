
// Responsible for: SVG map drawing, hover interactions, label rendering.
// Public:
//   drawMapWithPartnerColors(svg, geojsonData, numberData)  -> overview map
//   drawMap(geojson, filteredGeoJSON, partner)              -> bilateral/multilateral map
//   fitSizeMap(geoJSON)                                     -> returns path generator
 
import { svg } from "./globals.js";

let g; // at the module-level container. Reassigned at each draw

// Per-country label position overrides.
// dx/dy: pixel offset from centroid. lines: override text split.
const countryLabelConfig = {
  Senegal:          { dx: -40, dy: 5 },
  Guinea:           { dx: -40, dy: 8 },
  "Ivory Coast":    { dx: -20, dy: 35 },
  Somalia:          { dx: 20,  dy: 10 },
  "Guinea Bissau":  { dx: -35, dy: 6 },
  Mali:             { dx: 20,  dy: 0 },
  Algeria:          { dx: 0,   dy: 10 },
  Libya:            { dx: 0,   dy: 5 },
  Rwanda:           { dx: 15,  dy: 3 },
  Zambia:           { dx: -8,  dy: 12 },
  Malawi:           { dx: 7,   dy: 2 },
  Mozambique:       { dx: 14,  dy: 10 },
  Namibia:          { dx: 0,   dy: 5 },
  Madagascar:       { dx: 15,  dy: 0 },
  "South Africa":   { lines: ["SOUTH", "AFRICA"], dx: -10, dy: 0 },
};

// ── Public: overview map ──────────────────────────────────────────────────────
 
export function drawMapWithPartnerColors(svg, geojsonData, numberData) {
  const mapEl = document.querySelector("#map");
  if (!mapEl) { console.error("drawMapWithPartnerColors: #map not found"); return; }
 
  // Clear all previous SVG content — fixes stale <g> accumulation (double SVG bug)
  svg.selectAll("*").remove();
  svg.attr("viewBox", getViewBox(mapEl));
 
  const W = mapEl.clientWidth;
  const H = mapEl.clientHeight;
 
  if (!W || !H) { console.error("drawMapWithPartnerColors: #map has no dimensions"); return; }
 
  // fitSize automatically scales and centers the projection to fill [W, H]
  const projection = d3.geoEqualEarth().fitSize([W, H], geojsonData);
  const path = d3.geoPath().projection(projection);
 
  const colorScale = d3.scaleQuantize()
    .domain([0, 6])
    .range(["#F2F2F2", "#FEE2A4", "#FCCA7B", "#FCC12C", "#EA9B0F", "#D68F01", "#9E6604"]);
 
  const colorScaleHover = d3.scaleQuantize()
    .domain([0, 6])
    .range(["#F2F2F2", "#FFF1D4", "#FCE0B1", "#FDDA84", "#F3C471", "#E2B369", "#BC8C46"]);
 
  // Build lookup for O(1) country data access
  const partnerLookup = new Map(
    numberData.map(d => [d.africanCountry, d])
  );
 
  g = svg.append("g");
  const tooltip = getOrCreateTooltip();
 
  // Country paths
  g.selectAll("path")
    .data(geojsonData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "country-path")
    .attr("fill", d => {
      const count = partnerLookup.get(d.properties.name)?.partnersNo || 0;
      return colorScale(count);
    })
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .on("mouseover", function(event, d) {
      const countryName = d.properties.name;
      const countryData = partnerLookup.get(countryName);
      const count = countryData?.partnersNo || 0;
 
      d3.select(this).transition().duration(200).attr("fill", colorScaleHover(count));
 
      if (window.innerWidth > 768) {
        tooltip
          .html(buildTooltipHTML(countryName, count, countryData?.partners || []))
          .style("display", "block")
          .style("pointer-events", "none");
      }
    })
    .on("mouseout", function(event, d) {
      const count = partnerLookup.get(d.properties.name)?.partnersNo || 0;
      d3.select(this).transition().duration(200).attr("fill", colorScale(count));
      tooltip.style("display", "none");
    })
    .on("mousemove", function(event) {
      positionTooltip(event, tooltip);
    });
 
  // Labels — only for African countries with partnerships
  const featuresWithData = geojsonData.features.filter(
    d => (partnerLookup.get(d.properties.name)?.partnersNo || 0) > 0
  );
 
  g.selectAll("text.country-label")
    .data(featuresWithData)
    .enter()
    .append("text")
    .attr("class", "country-label")
    .attr("text-anchor", "middle")
    .attr("font-size", "5pt")
    .attr("fill", "black")
    .attr("pointer-events", "none")
    .attr("opacity", 1)
    .each(function(d) {
      renderLabel(d3.select(this), d, path);
    });
}
// ── Public: bilateral / multilateral map ──────────────────────────────────────
export function drawMap(geojson, filteredCountryGeoJSON, partner) {
  const mapEl = document.querySelector("#map");
  if (!mapEl) { console.error("drawMap: #map not found"); return; }
 
  svg.selectAll("*").remove();
  svg.attr("viewBox", getViewBox(mapEl));
 
  const W = mapEl.clientWidth;
  const H = mapEl.clientHeight;
 
  const projection = d3.geoMercator()
    .scale(400)
    .translate([W / 2, H / 2]);
  const path = d3.geoPath().projection(projection);
 
  g = svg.append("g");
 
  // All countries — grey base layer
  g.selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#d3d3d3")
    .attr("stroke", "white")
    .attr("stroke-width", 0.5);
 
  // Labels for filtered (partner/African) countries
  g.selectAll("text.city-label")
    .data(filteredCountryGeoJSON.features)
    .enter()
    .append("text")
    .attr("class", "city-label")
    .attr("text-anchor", "middle")
    .attr("font-size", "5pt")
    .attr("fill", "black")
    .attr("pointer-events", "none")
    .attr("opacity", 0) // shown via toggle
    .each(function(d) {
      renderLabel(d3.select(this), d, path);
    });
}
// ── Public: path generator helper ────────────────────────────────────────────
export function fitSizeMap(geoJSON) {
  const mapEl = document.querySelector("#map");
  const W = mapEl?.clientWidth || 800;
  const H = mapEl?.clientHeight || 500;
  const projection = d3.geoEqualEarth().fitSize([W, H], geoJSON);
  return d3.geoPath().projection(projection);
}
 
// ── Private: label rendering ──────────────────────────────────────────────────
function renderLabel(textEl, feature, path) {
  const name = feature.properties.name;
  const config = countryLabelConfig[name] || {};
  const centroid = path.centroid(feature);
 
  if (!centroid || isNaN(centroid[0])) return; // for invalid centroids
 
  const cx = centroid[0] + (config.dx || 0);
  const cy = centroid[1] + (config.dy || 0);
 
  const lines = config.lines || wrapText(name.toUpperCase(), 13);
 
  lines.forEach((line, i) => {
    textEl.append("tspan")
      .attr("x", cx)
      .attr("y", cy + i * 8)
      .text(line);
  });
}

// ── Private: tooltip ──────────────────────────────────────────────────────────
function getOrCreateTooltip() {
  const existing = d3.select(".tooltip2");
  if (!existing.empty()) return existing;
  return d3.select("body")
    .append("div")
    .attr("class", "tooltip2")
    .style("display", "none");
}
 
function buildTooltipHTML(countryName, partnerCount, partnersList) {
  const partnersHTML = partnersList
    .map(p => `<p class="mb-0">${p}</p>`)
    .join("");
  return `
    <h3 class="fw-bold mb-1" style="font-size:13pt">${countryName}</h3>
    ${partnerCount > 0
      ? `<p class="mb-1" style="font-size:11pt">
           ${partnerCount} partner${partnerCount !== 1 ? "s" : ""}
         </p>
         <div style="font-size:11pt">${partnersHTML}</div>`
      : ""}
  `;
}
 
function positionTooltip(event, tooltip) {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    const w = tooltip.node().offsetWidth;
    const h = tooltip.node().offsetHeight;
    tooltip
      .style("left", `${window.innerWidth / 2 - w / 2}px`)
      .style("top",  `${window.innerHeight / 2 - h / 2 + 200}px`);
  } else {
    tooltip
      .style("left", `${event.pageX + 10}px`)
      .style("top",  `${event.pageY + 10}px`);
  }
}
// ── Private: viewBox ──────────────────────────────────────────────────────────
function getViewBox(el) {
  const w = el.clientWidth;
  const h = el.clientHeight;
  if (w < 576) {
    svg.attr("preserveAspectRatio", "xMidYMin meet");
    return "-200 -225 700 900";
  }
  if (w < 1024) {
    svg.attr("preserveAspectRatio", "xMidYMin meet");
    return "-150 -25 925 600";
  }
  svg.attr("preserveAspectRatio", "xMidYMid meet");
  return `0 0 ${w} ${h}`;
}
 
// ── Private: text wrapping ────────────────────────────────────────────────────
function wrapText(text, maxLength) {
  const words = text.split(" ");
  let currentLine = "";
  const lines = [];
  words.forEach(word => {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines;
}