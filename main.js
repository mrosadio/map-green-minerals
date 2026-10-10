import { loadAndMergeData, mergeMulti, createBlocGeoJSON, filterCountriesByPartner, filterEUandPartners } from "./modules/dataUtils.js";
import { drawMap, drawMapWithPartnerColors, drawMultilateralOverview, multilateralColorScale } from "./modules/mapUtils.js";
import { highlightPartnership, populatePartnerships, populateMultilateral, highlightBloc, highlightEu, clearCardContent } from "./modules/selectionUtils.js";
import { addLegend } from "./modules/legendUtils.js";
import { svg, worldGeojsonPath, jsonFilePath, multiJsonFilePath, noPartnerFilePath } from "./modules/globals.js";
import { showThirdColumn, removeThirdColumn, isPickerLayout, PICKER_QUERY } from "./modules/layout.js";
import { showPickerBilateral, showPickerMultilateral, closePicker } from "./modules/picker.js";
import { initRotatePrompt } from "./modules/rotatePrompt.js";
import { amberRamp } from "./modules/colors.js";
const euGeojsonPath = `./db/eu.geojson`;

let partnerNarratives = [];
let mergedBiData;
let numberData;
let colorScale;
let multiGeoDataRef; // set once loaded — needed by the mode toggle's multilateral overview call
let currentMode = "bilateral"; // "bilateral" , "multilateral"
let currentView = { type: "overview" }; // "overview" | "partner" | "bloc" — what redraw() should redraw

function resetToInitialView() {
  currentView = { type: "overview" };
  document.querySelector("#legend-container").classList.remove("legend-hidden");
  removeThirdColumn();
  drawMapWithPartnerColors(svg, mergedBiData, numberData);
  clearCardContent();
  addLegend(svg, colorScale);
}
function resetToMultilateralOverview() {
  currentView = { type: "overview" };
  document.querySelector("#legend-container").classList.remove("legend-hidden");
  removeThirdColumn();
  drawMultilateralOverview(svg, multiGeoDataRef, numberData);
  clearCardContent();
  addLegend(svg, multilateralColorScale, "Number of coalitions", ["1", "3+"]);
}
// Resets to whichever mode is currently active used by the "Overview"
// button, so both respect the toggle state instead of always assuming bilateral
function resetToCurrentOverview() {
  if (currentMode === "multilateral") {
    resetToMultilateralOverview();
  } else {
    resetToInitialView();
  }
}
function setMode(mode) {
  document.documentElement.dataset.mode = mode;
  currentMode = mode;
  const isBilateral = mode === "bilateral";
  document.getElementById("bilateralModeBtn").classList.toggle("active", isBilateral);
  document.getElementById("multilateralModeBtn").classList.toggle("active", !isBilateral);
  document.getElementById("bilateralModeBtn").setAttribute("aria-pressed", String(isBilateral));
  document.getElementById("multilateralModeBtn").setAttribute("aria-pressed", String(!isBilateral));
  document.getElementById("bilateralDropdownGroup").classList.toggle("d-none", !isBilateral);
  document.getElementById("multilateralDropdownGroup").classList.toggle("d-none", isBilateral);
  resetToCurrentOverview();
}
// Publish the nav's real height as --nav-h so overlays can sit below it
// It changes with title wrapping, fonts and breakpoints, so it can't be hardcoded
// resizeobserver fires on load and when nav size changes - no manual resize listener
const navEl = document.querySelector("#nav");
if (navEl) {
  new ResizeObserver(([entry]) => {
    document.documentElement.style.setProperty("--nav-h", `${entry.target.getBoundingClientRect().height}px`);
  }).observe(navEl);
}
// Phones only (up to 600px): route Partner/Coalition taps to the wheel picker instead of
// Bootstrap's dropdown. Bootstrap 5 registers its delegated click handler on
// `document` in the capture phase, so a listener on the button (bubble phase)
// always fires too late to stop it. `window` capture runs earlier.
window.addEventListener(
  "click",
  (e) => {
    if (!isPickerLayout()) return;
    const btn = e.target.closest("#bilateralToggle, #multilateralToggle");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    if (btn.id === "bilateralToggle") showPickerBilateral();
    else showPickerMultilateral();
  },
  true,
);
// If the picker is open and the window grows past the phone breakpoint (rotation,
// resize), close it: the picker's styles only exist for phone widths
window.matchMedia(PICKER_QUERY).addEventListener("change", (e) => {
  if (!e.matches) closePicker();
});
// Fetch the world GeoJSON once, up front - previously loadAndMergeData,
// mergeMulti, and createBlocGeoJSON each fetched it independently, meaning
// every page load re-downloaded the same large file two or three times.
initRotatePrompt();

// Bootstrap sets aria-hidden on the modal while its Close button still has focus,
// which browsers flag as "blocked aria-hidden on an element whose descendant retained focus".
// Blurring first lets the attribute apply cleanly; focus returns to the opener afterwards.
document.querySelector("#aboutModal")?.addEventListener("hide.bs.modal", () => {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
});
Promise.all([fetch(worldGeojsonPath).then((r) => r.json()), fetch("./db/partnerNarratives.json").then((r) => r.json())])
  .then(([worldGeoJSON, partnerNarrativesData]) => {
    partnerNarratives = partnerNarrativesData;

    return Promise.all([loadAndMergeData(worldGeoJSON, jsonFilePath, noPartnerFilePath), mergeMulti(worldGeoJSON, multiJsonFilePath)]).then(([bilateralData, multiData]) => {
      if (bilateralData && multiData) {
        mergedBiData = bilateralData.geojsonData;
        const biData = bilateralData.jsonData;
        numberData = bilateralData.nojsonData;
        const multiGeoData = multiData.geojsonMultiData;
        multiGeoDataRef = multiGeoData;
        const multiJsonData = multiData.multiJsonData;

        colorScale = d3
          .scaleQuantize()
          .domain([0, d3.max(numberData, (d) => d.partnersNo)])
          .range(amberRamp()); // --seq-amber-* tokens in style.css

        resetToInitialView();
        document.querySelector("#africaButton").addEventListener("click", resetToCurrentOverview);
        document.addEventListener("overview:selected", resetToCurrentOverview);
        document.getElementById("bilateralModeBtn").addEventListener("click", () => setMode("bilateral"));
        document.getElementById("multilateralModeBtn").addEventListener("click", () => setMode("multilateral"));
        function drawPartnerMap(item) {
          const selectedCountry = item.textContent.trim();
          let internalSelectedCountry = selectedCountry;
          if (selectedCountry === "United Kingdom") internalSelectedCountry = "England";
          if (selectedCountry === "European Union") internalSelectedCountry = "EU";
          if (selectedCountry === "United States") internalSelectedCountry = "USA";

          if (item.textContent.includes("EU") || item.textContent.includes("European Union")) {
            return filterEUandPartners(mergedBiData, biData).then((filtered) => {
              drawMap(mergedBiData, filtered, "EU");
              highlightEu(svg, filtered);
            });
          }
          const filtered = filterCountriesByPartner(mergedBiData, internalSelectedCountry);
          drawMap(mergedBiData, filtered, internalSelectedCountry);
          highlightPartnership(svg, filtered, item.textContent);
          return Promise.resolve();
        }

        function showPartner(item) {
          currentView = { type: "partner", item };
          document.querySelector("#legend-container").classList.add("legend-hidden");
          showThirdColumn();
          drawPartnerMap(item);
          populatePartnerships(biData, item.textContent.trim(), partnerNarratives);
        }

        function drawBlocMap(item) {
          const selectedBloc = item.textContent.trim();
          return createBlocGeoJSON(worldGeoJSON, multiJsonFilePath, selectedBloc, euGeojsonPath).then((filtered) => {
            const mergedMapData = { type: "FeatureCollection", features: [...mergedBiData.features] };
            const existingNames = new Set(mergedBiData.features.map((f) => f.properties.name));
            filtered.features.forEach((feature) => {
              if (!existingNames.has(feature.properties.name)) mergedMapData.features.push(feature);
            });
            drawMap(mergedMapData, filtered, selectedBloc);
            highlightBloc(svg, filtered, new Set(numberData.map((d) => d.africanCountry)));
            return filtered;
          });
        }

        function showBloc(item) {
          currentView = { type: "bloc", item };
          document.querySelector("#legend-container").classList.add("legend-hidden");
          showThirdColumn();
          drawBlocMap(item)
            .then(() => populateMultilateral(item.textContent.trim(), multiJsonData))
            .catch((error) => console.error("Error processing filtered GeoJSON:", error));
        }

        document.querySelectorAll(".country-select").forEach((item) => item.addEventListener("click", () => showPartner(item)));
        document.querySelectorAll(".bloc-select").forEach((item) => item.addEventListener("click", () => showBloc(item)));

        // Redraw the map (not the panel) when the container's size changes:
        // rotation, window resize, split-screen
        function redraw() {
          if (currentView.type === "partner") drawPartnerMap(currentView.item);
          else if (currentView.type === "bloc") drawBlocMap(currentView.item).catch(console.error);
          else resetToCurrentOverview();
        }

        let lastSize = null;
        let resizeTimer;
        new ResizeObserver(([entry]) => {
          const { width, height } = entry.contentRect;
          if (!lastSize) {
            lastSize = { width, height };
            return;
          } // first callback = initial size
          // Ignore jitter (e.g. a phone's URL bar collapsing); redraw on real changes only
          if (Math.abs(width - lastSize.width) <= 2 && Math.abs(height - lastSize.height) <= 120) return;
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            lastSize = { width, height };
            redraw();
          }, 150);
        }).observe(document.querySelector("#map"));
      }
    });
  })
  .catch((error) => console.error("Error processing data:", error));