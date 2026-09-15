import { loadAndMergeData, mergeMulti, createBlocGeoJSON, mergeWorldWithPartnerData, filterCountriesByPartner, filterEUandPartners } from "./modules/dataUtils.js";
import { drawMap, drawMapWithPartnerColors, drawMultilateralOverview, multilateralColorScale, fitSizeMap, resetMapPan, panMapforPartner } from "./modules/mapUtils.js";
import { highlightPartnership, populatePartnerships, populateMultilateral, highlightBloc, highlightEu, clearCardContent } from "./modules/selectionUtils.js";
import { addLegend } from "./modules/legendUtils.js";
import { svg, blocColors, worldGeojsonPath, jsonFilePath, multiJsonFilePath, noPartnerFilePath } from "./modules/globals.js";
import { showThirdColumn, removeThirdColumn } from "./modules/layout.js";
import { showPickerBilateral, showPickerMultilateral, showPickerAfrica } from "./modules/picker.js";
const euGeojsonPath = `./db/eu.geojson`;

let partnerMap = {};
let multilateralMap = {};
let partnerNarratives = [];
let filteredGeoJSON;
let mergedBiData;
let numberData;
let colorScale;
let multiGeoDataRef; // set once loaded — needed by the mode toggle's multilateral overview call
let currentMode = "bilateral"; // "bilateral" , "multilateral"

function resetToInitialView() {
  document.querySelector("#legend-container").classList.remove("legend-hidden");
  removeThirdColumn();
  filteredGeoJSON = mergeWorldWithPartnerData(mergedBiData, numberData);
  drawMapWithPartnerColors(svg, filteredGeoJSON, numberData);
  clearCardContent();
  addLegend(svg, colorScale);
}
function resetToMultilateralOverview() {
  document.querySelector("#legend-container").classList.remove("legend-hidden");
  removeThirdColumn();
  drawMultilateralOverview(svg, multiGeoDataRef, numberData);
  clearCardContent();
  addLegend(svg, multilateralColorScale, "Number of coalitions", ["1", "3+"]);
}
// Resets to whichever mode is currently active — used by the "Overview"
// button and the overview:selected event, so both respect the toggle
// state instead of always assuming bilateral.
function resetToCurrentOverview() {
  if (currentMode === "multilateral") {
    resetToMultilateralOverview();
  } else {
    resetToInitialView();
  }
}

function refresh() {
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    console.log("refreshing in main.js");
    showPickerAfrica();
  } else {
    resetToCurrentOverview();
  }
}
function setMode(mode) {
  currentMode = mode;
  const isBilateral = mode === "bilateral";
  document.getElementById("bilateralModeBtn").classList.toggle("active", isBilateral);
  document.getElementById("multilateralModeBtn").classList.toggle("active", !isBilateral);
  document.getElementById("bilateralDropdownGroup").classList.toggle("d-none", !isBilateral);
  document.getElementById("multilateralDropdownGroup").classList.toggle("d-none", isBilateral);
  resetToCurrentOverview();
  resetMapPan();
}

// Fetch the world GeoJSON once, up front - previously loadAndMergeData,
// mergeMulti, and createBlocGeoJSON each fetched it independently, meaning
// every page load re-downloaded the same large file two or three times.
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

        mergedBiData.features.forEach((feature) => {
          const country = feature.properties.name;
          if (feature.properties.partners) {
            feature.properties.partners.forEach((partner) => {
              if (!partnerMap[country]) partnerMap[country] = [];
              partnerMap[country].push(partner);
            });
          }
        });

        multiGeoData.features.forEach((bloc) => {
          const blocName = bloc.properties.blocs;
          blocName.forEach((name) => {
            if (!multilateralMap[name]) multilateralMap[name] = [];
            bloc.properties.blocs.forEach((member) => {
              if (!multilateralMap[name].includes(member)) multilateralMap[name].push(member);
            });
          });
        });

        colorScale = d3
          .scaleQuantize()
          .domain([0, d3.max(numberData, (d) => d.partnersNo)])
          .range([
            "#F0EDEA", // 0 - warm grey, neutral
            "#F5DFB8", // 1 - pale sand
            "#F0C97A",
            "#E8B044",
            "#D4891A",
            "#B86C0A", // 5
            "#8C4D00", //+6
          ]);

        resetToInitialView();
        document.querySelector("#africaButton").addEventListener("click", () => {
          resetToCurrentOverview();
          resetMapPan();
        });
        document.querySelector("#showScrollable").addEventListener("click", () => {
          refresh();
        });
        document.addEventListener("overview:selected", () => {
          resetToCurrentOverview();
          resetMapPan();
        });
        document.addEventListener("panel:toggled", () => {
          fitSizeMap(filteredGeoJSON);
        });
        document.getElementById("bilateralModeBtn").addEventListener("click", () => setMode("bilateral"));
        document.getElementById("multilateralModeBtn").addEventListener("click", () => setMode("multilateral"));
        document.querySelectorAll(".country-select").forEach((item) => {
          item.addEventListener("click", function () {
            document.querySelector("#legend-container").classList.add("legend-hidden");
            showThirdColumn();
            let selectedCountry = this.textContent.trim();
            let internalSelectedCountry = selectedCountry;
            if (selectedCountry === "United Kingdom") internalSelectedCountry = "England";
            if (selectedCountry === "European Union") internalSelectedCountry = "EU";
            if (selectedCountry === "United States") internalSelectedCountry = "USA";
            if (item.textContent.includes("EU") || item.textContent.includes("European Union")) {
              filterEUandPartners(mergedBiData, biData).then((filteredCountryGeoJSON) => {
                drawMap(mergedBiData, filteredCountryGeoJSON, "EU");
                highlightEu(svg, filteredCountryGeoJSON);
                panMapforPartner(selectedCountry);
                populatePartnerships(biData, selectedCountry, partnerNarratives);
              });
            } else {
              const filteredCountryGeoJSON = filterCountriesByPartner(mergedBiData, internalSelectedCountry);
              drawMap(mergedBiData, filteredCountryGeoJSON, internalSelectedCountry);
              highlightPartnership(svg, filteredCountryGeoJSON, item.textContent);
              panMapforPartner(selectedCountry);
              populatePartnerships(biData, selectedCountry, partnerNarratives);
            }
          });
        });

        document.querySelectorAll(".bloc-select").forEach((item) => {
          item.addEventListener("click", function () {
            document.querySelector("#legend-container").classList.add("legend-hidden");
            showThirdColumn();
            const selectedBloc = this.textContent.trim();
            createBlocGeoJSON(worldGeoJSON, multiJsonFilePath, selectedBloc, euGeojsonPath)
              .then((filteredGeoJSON) => {
                const mergedMapData = {
                  type: "FeatureCollection",
                  features: [...mergedBiData.features],
                };
                const existingNames = new Set(mergedBiData.features.map((f) => f.properties.name));
                filteredGeoJSON.features.forEach((feature) => {
                  if (!existingNames.has(feature.properties.name)) {
                    mergedMapData.features.push(feature);
                  }
                });
                drawMap(mergedMapData, filteredGeoJSON, selectedBloc);
                highlightBloc(svg, filteredGeoJSON, new Set(numberData.map((d) => d.africanCountry)));
                populateMultilateral(filteredGeoJSON, selectedBloc, multiJsonData);
                panMapforPartner();
              })
              .catch((error) => console.error("Error processing filtered GeoJSON:", error));
          });
        });
        document.querySelector("#bilateralToggle").addEventListener("click", (e) => {
          if (/Mobi|Android/i.test(navigator.userAgent)) {
            e.preventDefault();
            e.stopPropagation();
            showPickerBilateral();
          }
        });
        document.querySelector("#multilateralToggle").addEventListener("click", (e) => {
          if (/Mobi|Android/i.test(navigator.userAgent)) {
            e.preventDefault();
            e.stopPropagation();
            showPickerMultilateral();
          }
        });
      }
    });
  })
  .catch((error) => console.error("Error processing data:", error));
