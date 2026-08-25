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
  Senegal: { dx: -40, dy: 5 },
  Guinea: { dx: -40, dy: 8 },
  "Ivory Coast": { dx: -20, dy: 35 },
  Somalia: { dx: 20, dy: 10 },
  "Guinea Bissau": { dx: -35, dy: 6 },
  Mali: { dx: 20, dy: 0 },
  Algeria: { dx: 0, dy: 10 },
  Libya: { dx: 0, dy: 5 },
  Rwanda: { dx: 15, dy: 3 },
  Zambia: { dx: -8, dy: 12 },
  Malawi: { dx: 7, dy: 2 },
  Mozambique: { dx: 14, dy: 10 },
  Namibia: { dx: 0, dy: 5 },
  Madagascar: { dx: 15, dy: 0 },
  "South Africa": { lines: ["SOUTH", "AFRICA"], dx: -10, dy: 0 },
};

const euMemberNames = new Set(["Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden"]);
const partnerNameNormalization = {
  USA: "United States",
  EU: "European Union",
  "United Kingdom": "England",
  // add others as you find them
};
const highlightColors = {
  individualPartner: "#FCC12C", // amber — single country bilateral partner
  euBloc: "#FCE0B1", // lighter amber — EU as bloc
  euMember: "#FCC12C", // same as individual — Germany etc. treated as individual
};

// ── Public: overview map ──────────────────────────────────────────────────────

export function drawMapWithPartnerColors(svg, geojsonData, numberData) {
  console.log("drawMapWithPartnerColors called, existing paths:", svg.selectAll("path").size());
  console.log(
    "Partners of Uganda",
    numberData.find((d) => d.africanCountry === "Uganda"),
  );

  const mapEl = document.querySelector("#map");
  if (!mapEl) {
    console.error("drawMapWithPartnerColors: #map not found");
    return;
  }

  // Clear all previous SVG content — fixes stale <g> accumulation (double SVG bug)
  svg.selectAll("*").remove();
  svg.attr("viewBox", getViewBox(mapEl));

  const W = mapEl.clientWidth;
  const H = mapEl.clientHeight;

  if (!W || !H) {
    console.error("drawMapWithPartnerColors: #map has no dimensions");
    return;
  }

  // fitSize automatically scales and centers the projection to fill [W, H]
  const projection = d3.geoEqualEarth().fitSize([W, H], geojsonData);
  const path = d3.geoPath().projection(projection);

  const colorScale = d3.scaleQuantize().domain([0, 6]).range([
    "#F0EDEA", // 0 — warm grey, clearly neutral
    "#F5DFB8", // 1 — pale sand
    "#F0C97A", // 2
    "#E8B044", // 3
    "#D4891A", // 4
    "#B86C0A", // 5
    "#8C4D00",
  ]);

  const colorScaleHover = d3.scaleQuantize().domain([0, 6]).range(["#F5F0EC", "#FAE9CA", "#F5D898", "#EEC268", "#DDA040", "#C87E20", "#A05C10"]);

  // Individual bilateral partner country fill
  const PARTNER_FILL = "#E8B044"; // mid-amber, matches choropleth step 3

  // EU bloc — border only, no fill
  const EU_STROKE = "#B86C0A"; // darker amber, clearly distinct
  const EU_STROKE_WIDTH = 2;

  // Non-partner, non-African countries
  const DEFAULT_FILL = "#E8E4DF"; // warm grey, not cold
  // Build lookup for O(1) country data access
  const partnerLookup = new Map(numberData.map((d) => [d.africanCountry, d]));

  g = svg.append("g");
  const tooltip = getOrCreateTooltip();

  // Country paths
  g.selectAll("path")
    .data(geojsonData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "country-path")
    .attr("fill", (d) => {
      const count = partnerLookup.get(d.properties.name)?.partnersNo || 0;
      return colorScale(count);
    })
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      const countryName = d.properties.name;
      const countryData = partnerLookup.get(countryName);
      const count = countryData?.partnersNo || 0;

      // Highlight hovered African country
      d3.select(this).transition().duration(200).attr("fill", colorScaleHover(count));

      if (count === 0) {
        tooltip.html(`<h3 class="fw-bold mb-0" style="font-size:12pt">${countryName}</h3>`).style("display", window.innerWidth > 768 ? "block" : "none");
        return;
      }

      const rawPartners = countryData?.partners || [];
      const hasEU = rawPartners.some((p) => cleanPartnerName(p) === "European Union" || cleanPartnerName(p) === "EU");

      // Individual bilateral partners (excluding EU)
      const individualPartners = new Set(rawPartners.map(cleanPartnerName).filter((p) => p !== "European Union" && p !== "EU"));

      // Highlight individual partner countries
      svg
        .selectAll("path")
        .filter((p) => individualPartners.has(p.properties?.name))
        .interrupt("partnerHighlight")
        .transition("partnerHighlight")
        .duration(200)
        .attr("fill", PARTNER_FILL)
        .attr("stroke", "#8C4D00")
        .attr("stroke-width", 1.5);

      // Highlight EU as border only
      if (hasEU) {
        g.selectAll("path")
          .filter((p) => euMemberNames.has(p.properties.name))
          .transition()
          .duration(200)
          .attr("stroke", EU_STROKE)
          .attr("stroke-width", EU_STROKE_WIDTH);
        // leave fill unchanged — EU members keep their default grey fill
      }

      tooltip.html(buildTooltipHTML(countryName, count, rawPartners)).style("display", window.innerWidth > 768 ? "block" : "none");
    })
    .on("mouseout", function (event, d) {
      const countryName = d.properties.name;
      const countryData = partnerLookup.get(countryName);
      const count = countryData?.partnersNo || 0;
      const rawPartners = countryData?.partners || [];
      // Restore hovered country
      d3.select(this)
        .interrupt() // <- cancel any running transition
        .transition()
        .duration(200)
        .attr("fill", colorScale(count));
      // Restore individual partners
      const individualPartners = new Set(rawPartners.map(cleanPartnerName).filter((p) => p !== "European Union" && p !== "EU"));
      console.log("mouseout for:", d.properties.name);
      console.log("partners to restore:", [...individualPartners]);

      // Check how many paths match
      const matched = svg.selectAll("path").filter((p) => p?.properties && individualPartners.has(p.properties.name));
      console.log("paths matched for restore:", matched.size());
      matched.each(function (p) {
        console.log("restoring:", p.properties.name, "current fill:", d3.select(this).attr("fill"), "target fill:", partnerLookup.get(p.properties.name)?.partnersNo > 0 ? "choropleth" : DEFAULT_FILL);
        setTimeout(() => {
          const austriaFill = svg
            .selectAll("path")
            .filter((p) => p?.properties?.name === "Austria")
            .attr("fill");
          console.log("Austria fill 500ms after mouseout:", austriaFill);
        }, 500);
      });
      // Restore partner countries — use their original fill, not DEFAULT_FILL
      svg
        .selectAll("path")
        .filter((p) => p?.properties && individualPartners.has(p.properties.name))
        .interrupt("partnerHighlight") // name the transition
        .transition("partnerHighlight") // same name cancels previous
        .duration(200)
        .attr("fill", (p) => {
          const count = partnerLookup.get(p.properties.name)?.partnersNo || 0;
          return count > 0 ? colorScale(count) : DEFAULT_FILL;
        })
        .attr("stroke", "white")
        .attr("stroke-width", 0.5);
      // Restore EU borders
      g.selectAll("path")
        .filter((p) => euMemberNames.has(p.properties.name))
        .interrupt()
        .transition()
        .duration(200)
        .attr("stroke", "white")
        .attr("stroke-width", 0.5);

      tooltip.style("display", "none");
    })
    .on("mousemove", function (event) {
      positionTooltip(event, tooltip);
    });

  // Labels — only for African countries with partnerships
  const featuresWithData = geojsonData.features.filter((d) => (partnerLookup.get(d.properties.name)?.partnersNo || 0) > 0);

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
    .each(function (d) {
      renderLabel(d3.select(this), d, path);
    });
}
// ── Public: bilateral / multilateral map ──────────────────────────────────────
export function drawMap(geojson, filteredCountryGeoJSON, partner) {
  console.log("Content of filtered", filteredCountryGeoJSON);
  const mapEl = document.querySelector("#map");
  if (!mapEl) {
    console.error("drawMap: #map not found");
    return;
  }

  svg.selectAll("*").remove();
  svg.attr("viewBox", getViewBox(mapEl));

  const W = mapEl.clientWidth;
  const H = mapEl.clientHeight;

  if (!W || !H) {
    console.error("drawMap: #map has no dimensions");
    return;
  }

  // fitSize automatically scales and centers the projection to fill [W, H]
  const projection = d3.geoEqualEarth().fitSize([W, H], geojson);
  const path = d3.geoPath().projection(projection);

  g = svg.append("g");

  // All countries — grey base layer
  g.selectAll("path").data(geojson.features).enter().append("path").attr("d", path).attr("fill", "#d3d3d3").attr("stroke", "white").attr("stroke-width", 0.5);

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
    .each(function (d) {
      renderLabel(d3.select(this), d, path);
    });
}

// -- Public: when partners local at the right-side of the world map selected --
// Module-level flag in mapUtils.js
let legendShiftApplied = false;
let shiftedViewBox = null; // stores the viewBox after first shift

export function panMapforPartner(partnerName) {
  if (legendShiftApplied && shiftedViewBox) {
    // Already shifted — just reapply the stored shifted viewBox
    // (handles case where drawMap resets the viewBox between selections)
    svg.attr("viewBox", shiftedViewBox);
    return;
  }
  const mapEl = document.querySelector("#map");
  const vb = getViewBox(mapEl).split(" ").map(Number);
  vb[0] = vb[0] + 150;

  shiftedViewBox = vb.join(" ");
  svg.transition("mapPan").duration(400).attr("viewBox", shiftedViewBox);

  legendShiftApplied = true;
}

export function resetMapPan() {
  const mapEl = document.querySelector("#map");
  svg.transition("mapPan").duration(400)
    .attr("viewBox", getViewBox(mapEl));
  // Reset both flag and stored viewBox
  legendShiftApplied = false;
  shiftedViewBox = null;
}
// ── Public: path generator helper ────────────────────────────────────────────
export function fitSizeMap(geoJSON) {
  const mapEl = document.querySelector("#map");
  const W = mapEl?.clientWidth || 800;
  const H = mapEl?.clientHeight || 500;
  const projection = d3.geoEqualEarth().fitSize([W, H], geoJSON);
  return d3.geoPath().projection(projection);
}
// -- Private: Strip year annotation from partner name  ─────────────────────────
// e.g "Turkey (2016)" -> "Turkey"
function cleanPartnerName(name) {
  const cleaned = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return partnerNameNormalization[cleaned] || cleaned;
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
    textEl
      .append("tspan")
      .attr("x", cx)
      .attr("y", cy + i * 8)
      .text(line);
  });
}

// ── Private: tooltip ──────────────────────────────────────────────────────────
function getOrCreateTooltip() {
  const existing = d3.select(".tooltip2");
  if (!existing.empty()) return existing;
  return d3.select("body").append("div").attr("class", "tooltip2").style("display", "none");
}

function buildTooltipHTML(countryName, partnerCount, rawPartners) {
  const cleaned = rawPartners.map((p) => ({
    name: cleanPartnerName(p),
    year: p.match(/\((\d{4})\)/)?.[1] || null,
  }));

  const euEntry = cleaned.find((p) => p.name === "EU" || p.name === "European Union");
  const individuals = cleaned.filter((p) => p.name !== "EU" && p.name !== "European Union");

  const partnersHTML = [...individuals.map((p) => `<p class="mb-0">${p.name}${p.year ? ` <span class="text-secondary" style="font-size:8pt">${p.year}</span>` : ""}</p>`), ...(euEntry ? [`<p class="mb-0">European Union <span class="text-secondary" style="font-size:8pt">(as bloc${euEntry.year ? ` · ${euEntry.year}` : ""})</span></p>`] : [])].join("");

  return `
    <p class="fw-bold mb-1" style="font-size:12pt">${countryName}</p>
    <p class="text-secondary mb-2" style="font-size:9pt">
      ${partnerCount} bilateral agreement${partnerCount !== 1 ? "s" : ""}
    </p>
    <div style="font-size:9.5pt">${partnersHTML}</div>
  `;
}

function positionTooltip(event, tooltip) {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    const w = tooltip.node().offsetWidth;
    const h = tooltip.node().offsetHeight;
    tooltip.style("left", `${window.innerWidth / 2 - w / 2}px`).style("top", `${window.innerHeight / 2 - h / 2 + 200}px`);
  } else {
    tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY + 10}px`);
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
  words.forEach((word) => {
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
