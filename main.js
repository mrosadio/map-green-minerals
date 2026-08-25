import {
  loadAndMergeData,
  mergeMulti,
  createBlocGeoJSON,
  mergeWorldWithPartnerData,
  filterCountriesByPartner,
  filterEUandPartners,
} from "./modules/dataUtils.js";
import {
  drawMap,
  drawMapWithPartnerColors,
  fitSizeMap,
  resetMapPan,
  panMapforPartner
} from "./modules/mapUtils.js";
import {
  highlightPartnership,
  populatePartnerships,
  populateMultilateral,
  highlightBloc,
  highlightEu,
  clearCardContent,
} from "./modules/selectionUtils.js";
import { addLegend /*, hideLegend*/ } from "./modules/legendUtils.js";
import {
  svg,
  customColors,
  blocColors,
  geojsonUrl,
  jsonFilePath,
  multiJsonFilePath,
  noPartnerFilePath,
  themeUrl,
} from "./modules/globals.js";
import { showThirdColumn, removeThirdColumn } from "./modules/layout.js";
import { showPickerBilateral, showPickerMultilateral, showPickerAfrica } from "./modules/picker.js";
const euGeojsonPath = `./db/eu.geojson`;

let partnerMap = {};
let multilateralMap = {};
let filteredGeoJSON;
let mergedBiData; 
let numberData; // Para referencia global
let colorScale; // Para referencia global

// Tooltip
// const tooltip = d3
//   .select("body")
//   .append("div")
//   .attr("class", "tooltip")
//   .style("position", "absolute")
//   .style("pointer-events", "none")
//   .style("background", "#fff")
//   .style("border", ".5px solid #ddd")
//   .style("border-radius", "3px")
//   .style("padding", "5px")
//   .style("font-size", "12px")
//   .style("opacity", 0);

// Función para restablecer el mapa a su estado inicial

function resetToInitialView() {
  console.log('reseting in main.js')
  document.querySelector('.container-map').classList.remove('legend-hidden');
  filteredGeoJSON = mergeWorldWithPartnerData(mergedBiData, numberData); // Filtra África
  fitSizeMap(filteredGeoJSON)
  drawMapWithPartnerColors(svg, /*path,*/ filteredGeoJSON, numberData); // Dibuja el mapa inicial
  clearCardContent();
  addLegend(svg, colorScale); 
  removeThirdColumn(); // Oculta la tercera columna
}

function refresh() {
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    console.log("refreshing in main.js")
    showPickerAfrica();
  } else {
    resetToInitialView();
  }
}

console.log('console before promise')
Promise.all([
  loadAndMergeData(geojsonUrl, jsonFilePath, noPartnerFilePath),
  mergeMulti(geojsonUrl, multiJsonFilePath),
])
  .then(([bilateralData, multiData]) => {
    if (bilateralData && multiData) {
      mergedBiData = bilateralData.geojsonData;
      const biData = bilateralData.jsonData;
      numberData = bilateralData.nojsonData;
      const multiGeoData = multiData.geojsonMultiData;
      const multiJsonData = multiData.multiJsonData;
      console.log('multi geojson content showing', multiGeoData)
      mergedBiData.features.forEach((feature) => {
        const country = feature.properties.name;
        if (feature.properties.partners) {
          feature.properties.partners.forEach((partner) => {
            if (!partnerMap[country]) {
              partnerMap[country] = [];
            }
            partnerMap[country].push(partner);
          });
        }
      });

      multiGeoData.features.forEach((bloc) => {
        const blocName = bloc.properties.blocs;
        blocName.forEach((name) => {
          if (!multilateralMap[name]) {
            multilateralMap[name] = [];
          }
          bloc.properties.blocs.forEach((member) => {
            if (!multilateralMap[name].includes(member)) {
              multilateralMap[name].push(member);
            }
          });
        });
      });

      colorScale = d3
        .scaleQuantize()
        .domain([0, d3.max(numberData, (d) => d.partnersNo)])
        .range([
          "#F0EDEA",  // 0 — warm grey, clearly neutral
    "#F5DFB8",  // 1 — pale sand
    "#F0C97A",  // 2
    "#E8B044",  // 3
    "#D4891A",  // 4
    "#B86C0A",  // 5
    "#8C4D00"
        ]);

      resetToInitialView();
      document.querySelector("#africaButton").addEventListener('click', () => {
        resetToInitialView();
        resetMapPan()
      })
      document.querySelectorAll(".country-select").forEach((item) => {
        item.addEventListener("click", function () {
          document.querySelector('#legend-container').classList.add('legend-hidden');
          showThirdColumn();
          let selectedCountry = this.textContent.trim();
          let internalSelectedCountry = selectedCountry;
          if (selectedCountry === "United Kingdom") internalSelectedCountry = "England";
          if (selectedCountry === "European Union") internalSelectedCountry = "EU";
          if (selectedCountry === "United States") internalSelectedCountry = "USA";
          if (item.textContent.includes("EU") || item.textContent.includes("European Union")) {
            filterEUandPartners(mergedBiData, biData).then(
              (filteredCountryGeoJSON) => {
                console.log('drawmap in main.js')
                drawMap(mergedBiData, filteredCountryGeoJSON, "EU");
                highlightEu(svg, filteredCountryGeoJSON);
                /* highlightPartnership(
                  svg,
                  filteredCountryGeoJSON,
                  item.textContent
                );*/
                panMapforPartner(selectedCountry);
                populatePartnerships(biData, selectedCountry);
              }
            );
          } else {
            console.log('selectedCountry in ELSE CONDITION', selectedCountry)
            const filteredCountryGeoJSON = filterCountriesByPartner(
              mergedBiData,
              internalSelectedCountry
            );
            //deleteCountryLabels(filteredCountryGeoJSON);
            //destroyMap();
            drawMap(mergedBiData, filteredCountryGeoJSON, internalSelectedCountry);
            highlightPartnership(svg, filteredCountryGeoJSON, item.textContent);
            panMapforPartner(selectedCountry);
            populatePartnerships(biData, selectedCountry);
            //hideLegend();
          }
        });
      });

      document.querySelectorAll(".bloc-select").forEach((item) => {
        item.addEventListener("click", function () {
          document.querySelector('#legend-container').classList.add('legend-hidden');
          showThirdColumn();
          //handleSelection("multilateral", item.textContent);
          const selectedBloc = this.textContent.trim();
          const selectedColor = blocColors[selectedBloc] || "#ccc";
          createBlocGeoJSON(geojsonUrl, multiJsonFilePath, selectedBloc, euGeojsonPath)
            .then((filteredGeoJSON) => {
              //deleteCountryLabels(filteredGeoJSON);
              //destroyMap();
              
              // Merge filteredGeoJSON features with mergedBiData to include EU feature
              const mergedMapData = {
                type: "FeatureCollection",
                features: [...mergedBiData.features]
              };
              
              // Add features from filteredGeoJSON that don't exist in mergedBiData
              const existingNames = new Set(mergedBiData.features.map(f => f.properties.name));
              filteredGeoJSON.features.forEach(feature => {
                if (!existingNames.has(feature.properties.name)) {
                  mergedMapData.features.push(feature);
                }
              });
              drawMap(mergedMapData, filteredGeoJSON, selectedBloc);
              highlightBloc(svg, filteredGeoJSON, selectedColor, selectedBloc);
              populateMultilateral(
                filteredGeoJSON,
                selectedBloc,
                multiJsonData
              );
              panMapforPartner(); // same as bilateral
            })
            .catch((error) =>
              console.error("Error processing filtered GeoJSON:", error)
            );
        });
      });
    }
  })
  .catch((error) => console.error("Error processing data:", error));

//window.addEventListener("resize", changeButtonText);
//window.addEventListener("load", changeButtonText);
