// Responsible for: SVG map drawing, hover interactions, label rendering.
// Public:
//   drawMapWithPartnerColors(svg, geojsonData, numberData)  -> overview map
//   drawMap(geojson, filteredGeoJSON, partner)              -> bilateral/multilateral map
//   fitSizeMap(geoJSON)                                     -> returns path generator

import { svg } from "./globals.js";
import { isStackedLayout } from "./layout.js";
import { tealRamp, amberHoverRamp, getMapColors, DUR } from "./colors.js";

let g; // at the module-level container. Reassigned at each draw
let isPanned = false; // whether the horizontal shift is currently applied

// Per-country label position overrides.
// dx/dy: pixel offset from centroid. lines: override text split.
const countryLabelConfig = {
  Senegal: { dx: -10, dy: 0 },
  Guinea: { dx: 5, dy: 0 },
  "Ivory Coast": { lines: ["Ivory", "Coast"], dx: 0, dy: 5 },
  Somalia: { dx: 20, dy: 10 },
  "Guinea Bissau": { lines: ["Guinea-", "Bissau"], dx: -25, dy: 6 },
  Mali: { dx: 20, dy: 0 },
  Algeria: { dx: 0, dy: 10 },
  Libya: { dx: 0, dy: 5 },
  Rwanda: { dx: 15, dy: 3 },
  Zambia: { dx: -8, dy: 12 },
  Malawi: { dx: 7, dy: 2 },
  Mozambique: { dx: 14, dy: -10 },
  Namibia: { dx: 0, dy: 5 },
  Madagascar: { dx: 10, dy: 0 },
  Uganda: { dy: -5 },
  "South Africa": { lines: ["South", "Africa"], dx: -10, dy: 0 },
  "Democratic Republic of the Congo": { lines: ["Dem. Rep.", "of the Congo"] },
  "United Republic of Tanzania": { lines: ["Tanzania"] },
};

export const euMemberNames = new Set(["Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden"]);
const partnerNameNormalization = {
  USA: "United States",
  EU: "European Union",
  "United Kingdom": "England",
  // add others as you find them
};
// Colours come from the --seq-teal-* tokens in style.css (0 = no coalitions ... 3 = 3+)
export const multilateralColorScale = d3.scaleQuantize().domain([0, 3]).range(tealRamp());
const getLabelScale = (W) => (isStackedLayout() ? Math.min(Math.max(W / 600, 1), 1.8) : 1);
const canHover = () => window.matchMedia("(hover: hover)").matches;
const isAfricaFocus = () => isStackedLayout() && !canHover();
// -- Public: overview map ---------------------------------------------------------
export function drawMapWithPartnerColors(svg, geojsonData, numberData) {
  const mapEl = document.querySelector("#map");
  if (!mapEl) {
    console.error("drawMapWithPartnerColors: #map not found");
    return;
  }

  // Clear all previous SVG content — fixes stale <g> accumulation (double SVG bug)
  svg.selectAll("*").remove();
  svg.attr("viewBox", getViewBox(mapEl));

  const svgNode = svg.node();
  const W = svgNode.clientWidth;
  const H = svgNode.clientHeight;
  if (!W || !H) {
    console.error("drawMapWithPartnerColors: #map has no dimensions");
    return;
  }

  // fitSize automatically scales and centers the projection to fill [W, H]
  const projection = d3.geoEqualEarth().fitExtent(getOverviewExtent(W, H), getOverviewFitTarget(geojsonData, numberData));
  const path = d3.geoPath().projection(projection);

  // All colours come from the design tokens in style.css (see colors.js)
  const C = getMapColors();
  const colorScale = d3.scaleQuantize().domain([0, 6]).range(C.amber);
  const colorScaleHover = d3.scaleQuantize().domain([0, 6]).range(amberHoverRamp());
  const PARTNER_FILL = C.partnerHover; // individual bilateral partner country
  const EU_FILL = C.partnerSelected; // EU members
  const DEFAULT_FILL = C.mapDefault; // non-partner countries
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
    .attr("stroke", C.mapStroke)
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      if (!window.matchMedia("(hover: hover)").matches) return;
      const countryName = d.properties.name;
      const countryData = partnerLookup.get(countryName);
      const count = countryData?.partnersNo || 0;

      // if no partnership data no tooltip
      if (count === 0) {
        return;
      }
      // Highlight hovered African country
      d3.select(this).transition().duration(DUR.fast).attr("fill", colorScaleHover(count));
      if (count === 0) {
        tooltip.html(`<h3 class="tip-title mb-0">${countryName}</h3>`).style("display", "block");
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
        .duration(DUR.fast)
        .attr("fill", PARTNER_FILL);

      // Highlight EU as border only
      if (hasEU) {
        g.selectAll("path")
          .filter((p) => euMemberNames.has(p.properties.name))
          .transition()
          .duration(DUR.fast)
          .attr("fill", EU_FILL);
      }

      tooltip.html(buildTooltipHTML(countryName, count, rawPartners)).style("display", "block");
    })
    .on("mouseout", function (event, d) {
      if (!window.matchMedia("(hover: hover)").matches) return;
      const countryName = d.properties.name;
      const countryData = partnerLookup.get(countryName);
      const count = countryData?.partnersNo || 0;
      const rawPartners = countryData?.partners || [];
      // Restore hovered country
      d3.select(this)
        .interrupt() // <- cancel any running transition
        .transition()
        .duration(DUR.fast)
        .attr("fill", colorScale(count));
      // Restore individual partners
      const individualPartners = new Set(rawPartners.map(cleanPartnerName).filter((p) => p !== "European Union" && p !== "EU"));

      // Check how many paths match
      const matched = svg.selectAll("path").filter((p) => p?.properties && individualPartners.has(p.properties.name));
      matched.each(function (p) {
        setTimeout(() => {
          const austriaFill = svg
            .selectAll("path")
            .filter((p) => p?.properties?.name === "Austria")
            .attr("fill");
          //console.log("Austria fill 500ms after mouseout:", austriaFill);
        }, 500);
      });
      // Restore partner countries — use their original fill, not DEFAULT_FILL
      svg
        .selectAll("path")
        .filter((p) => p?.properties && individualPartners.has(p.properties.name))
        .interrupt("partnerHighlight") // name the transition
        .transition("partnerHighlight") // same name cancels previous
        .duration(DUR.fast)
        .attr("fill", (p) => {
          const count = partnerLookup.get(p.properties.name)?.partnersNo || 0;
          return count > 0 ? colorScale(count) : DEFAULT_FILL;
        })
        .attr("stroke", C.mapStroke)
        .attr("stroke-width", 0.5);
      // Restore EU borders
      g.selectAll("path")
        .filter((p) => euMemberNames.has(p.properties.name))
        .interrupt()
        .transition()
        .duration(DUR.fast)
        .attr("fill", DEFAULT_FILL)
        .attr("stroke", C.mapStroke)
        .attr("stroke-width", 0.5);

      tooltip.style("display", "none");
    })
    .on("mousemove", function (event) {
      positionTooltip(event, tooltip);
    });

  // Labels - only for African countries with partnerships
  const featuresWithData = geojsonData.features.filter((d) => (partnerLookup.get(d.properties.name)?.partnersNo || 0) > 0);
  const labelScale = getLabelScale(W);
  addCountryLabels(g, featuresWithData, path, labelScale);
}
// -- Public: bilateral / multilateral map --------------------------------------------
export function drawMap(geojson, filteredCountryGeoJSON, partner) {
  const mapEl = document.querySelector("#map");
  if (!mapEl) {
    console.error("drawMap: #map not found");
    return;
  }

  svg.selectAll("*").remove();

  const svgNode = svg.node();
  const W = svgNode.clientWidth;
  const H = svgNode.clientHeight;
  if (!W || !H) {
    console.error("drawMap: #map has no dimensions");
    return;
  }
  if (!filteredCountryGeoJSON.features.length) {
    console.error("drawMap: filteredCountryGeoJSON has no features to fit bounds to");
    return;
  }

  // Zoom/pan to fit just the selected partner + its African partners,
  // rather than fitting the projection to the whole world every time.
  // panMapforPartner()'s viewBox shift (called separately, after this)
  // is a different concern — it nudges the view to clear the detail
  // panel, and still runs regardless of how tightly we've zoomed here.
  const isSheetLayout = isStackedLayout();
  const ZOOM_PADDING = isSheetLayout ? 12 : 28;
  const navEl = document.querySelector("#nav");
  const navHeight = navEl ? navEl.getBoundingClientRect().height : 0;
  const topPadding = navHeight + ZOOM_PADDING;

  const detailPanelEl = document.querySelector(".right");
  const isPanelVisible = detailPanelEl && !detailPanelEl.classList.contains("d-none");

  // On phone, the panel is a bottom sheet (eats into height); on desktop,
  // it's a right-side panel (eats into width). Same goal —
  // the zoomed content shouldnt render behind either overlay but which
  // edge needs the padding flips at this breakpoint
  let rightPadding = ZOOM_PADDING;
  let bottomPadding = ZOOM_PADDING;
  if (isPanelVisible) {
    if (isSheetLayout) {
      bottomPadding = detailPanelEl.getBoundingClientRect().height + ZOOM_PADDING;
    } else {
      rightPadding = detailPanelEl.getBoundingClientRect().width + ZOOM_PADDING;
    }
  }
  const projection = d3.geoEqualEarth().fitExtent(
    [
      [ZOOM_PADDING, topPadding],
      [W - rightPadding, H - bottomPadding],
    ],
    filteredCountryGeoJSON,
  );
  const path = d3.geoPath().projection(projection);

  g = svg.append("g");

  const C = getMapColors();
  const tooltip = getOrCreateTooltip();
  g.selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", C.mapDefault)
    .attr("stroke", C.mapStroke)
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      if (!window.matchMedia("(hover: hover)").matches) return;
      const hasData = filteredCountryGeoJSON.features.some((f) => f.properties.name === d.properties.name);
      if (!hasData) return; // no tooltip for countries with no data
      tooltip.html(`<h3 class="tip-title mb-0">${d.properties.name}</h3>`).style("display", "block");
    })
    .on("mousemove", function (event) {
      positionTooltip(event, tooltip);
    })
    .on("mouseout", function () {
      if (!window.matchMedia("(hover: hover)").matches) return;
      tooltip.style("display", "none");
    });
  // No hover on touch devices: print the name of every highlighted country.
  // Labels that would collide are nudged apart (and joined to their country by a thin line), never dropped.
  if (!canHover()) {
    addCountryLabels(
      g,
      filteredCountryGeoJSON.features.filter((f) => !(partner === "EU" && euMemberNames.has(f.properties.name))),
      path,
      getLabelScale(W),
      { avoidOverlap: true, bounds: [W, H] }
    );
  }
}
// -- Public: multilateral map -----------------------------------------------
export function drawMultilateralOverview(svg, multiGeoData, numberData) {
  const mapEl = document.querySelector("#map");
  if (!mapEl) {
    console.error("drawMultilateralOverview: #map not found");
    return;
  }
  svg.selectAll("*").remove();
  svg.attr("viewBox", getViewBox(mapEl));

  const svgNode = svg.node();
  const W = svgNode.clientWidth;
  const H = svgNode.clientHeight;
  if (!W || !H) {
    console.error("drawMultilateralOverview: #map has no dimensions");
    return;
  }
  const projection = d3.geoEqualEarth().fitExtent(getOverviewExtent(W, H), getOverviewFitTarget(multiGeoData, numberData));
  const path = d3.geoPath().projection(projection);

  // Same reference set bilateral uses to distinguish African partner
  // countries from the rest of the world — otherwise non-African coalition
  // members (US, Japan, various EU states) get colored too, since they're
  // legitimately members of these blocs, just not the African side of them.
  const africanCountries = new Set(numberData.map((d) => d.africanCountry));

  const C = getMapColors();
  g = svg.append("g");
  const tooltip = getOrCreateTooltip();

  g.selectAll("path")
    .data(multiGeoData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "country-path")
    .attr("fill", (d) => {
      if (!africanCountries.has(d.properties.name)) return C.mapDefault;
      return multilateralColorScale(d.properties.blocs?.length || 0);
    })
    .attr("stroke", C.mapStroke)
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      if (!window.matchMedia("(hover: hover)").matches) return;
      if (!africanCountries.has(d.properties.name)) return;
      const blocs = d.properties.blocs || [];
      if (blocs.length === 0) return;

      d3.select(this).interrupt("blocHoverSelf").transition("blocHoverSelf").duration(DUR.fast).attr("fill", C.tealInk);

      const hoveredBlocs = new Set(blocs);
      g.selectAll("path")
        .filter((p) => p !== d && p.properties?.blocs?.some((b) => hoveredBlocs.has(b)))
        .interrupt("blocHover")
        .transition("blocHover")
        .duration(DUR.fast)
        .attr("fill", (p) => (africanCountries.has(p.properties.name) ? C.blocAfrican : C.blocNonAfrican));

      tooltip.html(buildBlocTooltipHTML(d.properties.name, blocs)).style("display", "block");
    })
    .on("mousemove", function (event) {
      positionTooltip(event, tooltip);
    })
    .on("mouseout", function (event, d) {
      if (!window.matchMedia("(hover: hover)").matches) return;
      if (!africanCountries.has(d.properties.name)) return;
      const count = d.properties.blocs?.length || 0;
      d3.select(this).interrupt("blocHoverSelf").transition("blocHoverSelf").duration(DUR.fast).attr("fill", multilateralColorScale(count));
      g.selectAll("path")
        .interrupt("blocHoverOthers")
        .transition("blocHoverOthers")
        .duration(DUR.fast)
        .attr("fill", (p) => (africanCountries.has(p.properties.name) ? multilateralColorScale(p.properties.blocs?.length || 0) : C.mapDefault));
      tooltip.style("display", "none");
    });
  // Labels - only for African countries with at least one coalition,
  // same pattern as the bilateral overview's featuresWithData filter
  const featuresWithData = multiGeoData.features.filter((d) => africanCountries.has(d.properties.name) && (d.properties.blocs?.length || 0) > 0);
  const labelScale = getLabelScale(W);
  addCountryLabels(g, featuresWithData, path, labelScale);
}

// -- Public: registers is map is already shifted ------------------------------
// Module-level flag in mapUtils.js
export function panMapforPartner() {
  const target = computeShiftedViewBox();
  if (isPanned) {
    svg.attr("viewBox", target); // already shifted — refresh in place, no slide
  } else {
    svg.transition("mapPan").duration(DUR.med).attr("viewBox", target);
  }
  isPanned = !isStackedLayout();
}
// -- Public: path generator helper ---------------------------------------------
export function fitSizeMap(geoJSON) {
  const mapEl = document.querySelector("#map");
  const W = mapEl?.clientWidth || 800;
  const H = mapEl?.clientHeight || 500;
  const projection = d3.geoEqualEarth().fitSize([W, H], geoJSON);
  return d3.geoPath().projection(projection);
}

// -- public: reset map ---------------------------------------------------------
export function resetMapPan() {
  svg.transition("mapPan").duration(DUR.med).attr("viewBox", getViewBox());
  isPanned = false;
}

// -- Private: Strip year annotation from partner name  -------------------------
// e.g "Turkey (2016)" -> "Turkey"
function cleanPartnerName(name) {
  const cleaned = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return partnerNameNormalization[cleaned] || cleaned;
}

// -- Private: One label routine for every map view to homogenize styling ------
function addCountryLabels(g, features, path, labelScale = 1, { avoidOverlap = false, bounds = null } = {}) {
  const ordered = avoidOverlap ? [...features].sort((a, b) => path.area(b) - path.area(a)) : features;
  const items = [];

  ordered.forEach((d, i) => {
    const text = g.append("text").attr("class", "country-label").attr("font-size", `${5 * labelScale}pt`);
    const anchor = renderLabel(text, d, path, labelScale, { mainPartOnly: avoidOverlap });
    if (!avoidOverlap) return;
    if (!anchor) return text.remove();
    const b = text.node().getBBox();
    items.push({ text, anchor, box: { x: b.x, y: b.y, w: b.width, h: b.height }, dx: 0, dy: 0, weight: i < ordered.length / 3 ? 0.25 : 1 });
  });
  if (!avoidOverlap) return;

  spreadLabels(items, bounds);

  items.forEach((it) => {
    if (!it.dx && !it.dy) return;
    it.text.attr("transform", `translate(${it.dx},${it.dy})`);
    if (Math.hypot(it.dx, it.dy) < 8 * labelScale) return;
    // leader line from the country to its displaced label
    g.insert("line", "text.country-label")
      .attr("class", "label-leader")
      .attr("x1", it.anchor[0])
      .attr("y1", it.anchor[1])
      .attr("x2", it.box.x + it.box.w / 2 + it.dx)
      .attr("y2", it.box.y + it.box.h / 2 + it.dy);
  });
}
// Push overlapping label boxes apart along the axis of least overlap (big countries move less)
function spreadLabels(items, bounds, pad = 2, rounds = 80) {
  const rect = (it) => ({ l: it.box.x + it.dx, t: it.box.y + it.dy, r: it.box.x + it.dx + it.box.w, b: it.box.y + it.dy + it.box.h });
  for (let n = 0; n < rounds; n++) {
    let moved = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const A = items[i], B = items[j];
        const a = rect(A), b = rect(B);
        const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l) + pad;
        const oy = Math.min(a.b, b.b) - Math.max(a.t, b.t) + pad;
        if (ox <= 0 || oy <= 0) continue;
        const wA = A.weight, wB = B.weight, total = wA + wB;
        const k = oy <= ox ? "dy" : "dx";
        const amount = oy <= ox ? oy : ox;
        const sign = (oy <= ox ? (a.t + a.b) - (b.t + b.b) : (a.l + a.r) - (b.l + b.r)) >= 0 ? 1 : -1;
        A[k] += sign * amount * (wA / total);
        B[k] -= sign * amount * (wB / total);
        moved = true;
      }
    }
    if (bounds) {
      items.forEach((it) => {
        const r = rect(it);
        if (r.l < 2) it.dx += 2 - r.l;
        if (r.r > bounds[0] - 2) it.dx -= r.r - (bounds[0] - 2);
        if (r.t < 2) it.dy += 2 - r.t;
        if (r.b > bounds[1] - 2) it.dy -= r.b - (bounds[1] - 2);
      });
    }
    if (!moved) break;
  }
}

// A MultiPolygon's centroid is pulled towards far-flung parts (France + French Guiana).
// Use only its largest polygon so the label sits on the main landmass.
function largestPart(feature, path) {
  if (feature.geometry.type !== "MultiPolygon") return feature;
  let best = null;
  let bestArea = -1;
  feature.geometry.coordinates.forEach((coordinates) => {
    const part = { type: "Feature", properties: feature.properties, geometry: { type: "Polygon", coordinates } };
    const area = path.area(part);
    if (area > bestArea) {
      best = part;
      bestArea = area;
    }
  });
  return best || feature;
}
// -- Private: label rendering --------------------------------------------------
function renderLabel(textEl, feature, path, labelScale = 1, { mainPartOnly = false } = {}) {
  const name = feature.properties.name;
  const config = countryLabelConfig[name] || {};
  const centroid = path.centroid(mainPartOnly ? largestPart(feature, path) : feature);

  if (!centroid || isNaN(centroid[0])) return null; // for invalid centroids

  const cx = centroid[0] + (config.dx || 0);
  const cy = centroid[1] + (config.dy || 0);

  const lines = config.lines || wrapText(name, 13);

  lines.forEach((line, i) => {
    textEl
      .append("tspan")
      .attr("x", cx)
      .attr("y", cy + i * 8 * labelScale)
      .text(line)
      .attr("font-size", "1.25em")
      .attr("color", "var(--color-text-primary)");
  });
  return [cx, cy];
}

// -- Private: tooltip --------------------------------------------------
function getOrCreateTooltip() {
  const existing = d3.select(".tooltip2");
  if (!existing.empty()) return existing;
  return d3.select("body").append("div").attr("class", "tooltip2").style("display", "none");
}
function buildBlocTooltipHTML(countryName, blocs) {
  const blocsHTML = blocs.map((name) => `<p class="mb-0">${name}</p>`).join("");

  return `
    <p class="tip-title mb-1">${countryName}</p>
    <p class="tip-meta mb-2">
      ${blocs.length} coalition${blocs.length !== 1 ? "s" : ""}
    </p>
    <div class="tip-list">${blocsHTML}</div>
  `;
}
function buildTooltipHTML(countryName, partnerCount, rawPartners) {
  const cleaned = rawPartners.map((p) => ({
    name: cleanPartnerName(p),
    year: p.match(/\((\d{4})\)/)?.[1] || null,
  }));
  const euEntry = cleaned.find((p) => p.name === "EU" || p.name === "European Union");
  const individuals = cleaned.filter((p) => p.name !== "EU" && p.name !== "European Union");
  const partnersHTML = [...individuals.map((p) => `<p class="mb-0">${p.name}${p.year ? ` <span class="tip-note">${p.year}</span>` : ""}</p>`), ...(euEntry ? [`<p class="mb-0">European Union <span class="tip-note">(as bloc${euEntry.year ? ` · ${euEntry.year}` : ""})</span></p>`] : [])].join("");

  return `
    <p class="tip-title mb-1">${countryName}</p>
    <p class="tip-meta mb-2">
      ${partnerCount} bilateral agreement${partnerCount !== 1 ? "s" : ""}
    </p>
    <div class="tip-list">${partnersHTML}</div>
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
// -- Private: viewBox ------------------------------------------------------------------
function getViewBox(el) {
  const svgNode = svg.node();
  const w = svgNode.clientWidth;
  const h = svgNode.clientHeight;
  if (w < 576) {
    svg.attr("preserveAspectRatio", "xMidYMin meet");
  } else if (w < 1024) {
    svg.attr("preserveAspectRatio", "xMidYMin meet");
  } else {
    svg.attr("preserveAspectRatio", "xMidYMid meet");
  }
  return `0 0 ${w} ${h}`;
}

// -- Private: text wrapping ----------------------------------------------------------------
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

// -- Private ------------------------------------------------------------------
function computeShiftedViewBox() {
  // const vb = getViewBox().split(" ").map(Number);
  // if (!isStackedLayout()) {
  //   vb[0] += 150;
  // }
  // return vb.join(" ");
  // drawMap now reserves room for the detail panel itself, so no extra shift is needed
  return getViewBox();
}

// -- Private: refit map for mobile view ---------------------------------------
// Shared helper on phone, fit the projection to just African countries
// instead of the whole world, so limited screen space isn't spent on
// Russia/Canada/South America just to reach the actual content.
function getOverviewFitTarget(geoData, numberData) {
  if (!isAfricaFocus()) return geoData;
  const africanCountries = new Set(numberData.map((d) => d.africanCountry));
  const features = geoData.features.filter((f) => africanCountries.has(f.properties.name));
  // Countries without data (e.g. Tunisia) arent in numberData: add Africa's extreme points so the fit covers the whole continent
  features.push({
    type: "Feature",
    properties: {},
    geometry: {
      type: "MultiPoint",
      coordinates: [
        [9.8, 37.4],
        [20, -34.9],
        [-17.6, 14.7],
        [51.4, 10.4],
      ],
    },
  });
  return { type: "FeatureCollection", features };
}

// In stacked layouts the nav floats over the map, so fit Africa into the
// space below it. Desktop keeps the full-canvas fit
function getOverviewExtent(W, H) {
  if (!isStackedLayout())
    return [
      [0, 0],
      [W, H],
    ];
  const PAD = 16;
  const navH = document.querySelector("#nav")?.getBoundingClientRect().height || 0;
  return [
    [PAD, navH + PAD],
    [W - PAD, H - PAD],
  ];
}
