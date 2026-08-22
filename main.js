import {
  loadAndMergeData,
  mergeMulti,
  createBlocGeoJSON,
  filterAfrica,
  filterCountriesByPartner,
  filterEUandPartners,
} from "./modules/dataUtils.js";
import {
  path,
  drawMap,
  drawMapWithPartnerColors,
  destroyMap,
  handleSelection,
  addCountryLabels,
  deleteCountryLabels,
  zoomIn,
  zoomOut,
  simulateCountryClick,
} from "./modules/mapUtils.js";
import {
  toggleButton,
  highlightPartnership,
  updateLabel,
  populatePartnerships,
  populateMultilateral,
  highlightBloc,
  highlightEu,
  clearCardContent,
} from "./modules/selectionUtils.js";
import { addLegend, hideLegend } from "./modules/legendUtils.js";
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
//import { initAboutModal } from "./modules/about.js";
const euGeojsonPath = `${themeUrl}/db/eu.geojson`;

let partnerMap = {};
let multilateralMap = {};
let filteredGeoJSON;
let mergedBiData; // Para referencia global
let numberData; // Para referencia global
let colorScale; // Para referencia global

// Tooltip
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("pointer-events", "none")
  .style("background", "#fff")
  .style("border", ".5px solid #ddd")
  .style("border-radius", "3px")
  .style("padding", "5px")
  .style("font-size", "12px")
  .style("opacity", 0);

// Función para restablecer el mapa a su estado inicial

function resetToInitialView() {
  destroyMap();
  filteredGeoJSON = filterAfrica(mergedBiData, numberData); // Filtra África
  drawMapWithPartnerColors(svg, path, filteredGeoJSON, numberData); // Dibuja el mapa inicial
  clearCardContent();
  addLegend(svg, colorScale); // Añade la leyenda
  removeThirdColumn(); // Oculta la tercera columna
  //initAboutModal();
  // zoomToCountry(svg, path, filteredGeoJSON, "Chad");
}
document.addEventListener("DOMContentLoaded", function () {
  const wheelElement = document.querySelector(".wheel");
  const scrollbarElement = document.querySelector(".wheel-scrollbar");

  wheelElement.addEventListener("scroll", function () {
    const scrollPercentage =
      wheelElement.scrollTop /
      (wheelElement.scrollHeight - wheelElement.clientHeight);
    scrollbarElement.style.top =
      scrollPercentage *
        (wheelElement.clientHeight - scrollbarElement.clientHeight) +
      "px";
  });
  // // Init modal once
  //initAboutModal();

  // // Wire About button in header
  // document.getElementById("about")
  //   ?.addEventListener("click", openAboutModal);
});
function refresh() {
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    // El usuario está en un dispositivo móvil
    //console.log("Estás en un dispositivo móvil");
    // simulateCountryClick(svg, filteredGeoJSON, "Chad");
    showPickerAfrica();
    //button.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    console.log("test222222");

    window.location.href = window.location.href;
  }
}
//document.getElementById("africaButton").addEventListener("click", refresh);

const buttonScroll = document.getElementById("africaButton");

// Asigna el evento click
buttonScroll.addEventListener("click", () => {
  //console.log("test");
  refresh();
  buttonScroll.scrollIntoView({ behavior: "smooth", block: "start" });
  const selectedBlock = document.getElementById("blockNameNowTemp");
  selectedBlock.innerText = "African countries overview";
  // console.log(selectedBlock);
});

// Load and merge data
console.log('multi json', multiJsonFilePath)
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
          "#F2F2F2", //0
          "#FEE2A4", //1
          "#FCCA7B", //2
          "#FCC12C", //3
          "#EA9B0F", //4
          "#D68F01", //5
          "#9E6604", //6
        ]);

      resetToInitialView();
      document.querySelectorAll(".country-select").forEach((item) => {
        item.addEventListener("click", function () {
          showThirdColumn();
          toggleButton(this);
          handleSelection("bilateral", item.textContent);
          let selectedCountry = this.textContent.trim();
          //  console.log(filteredCountryGeoJSON)
          // Map display names back to internal keys used by the data
          let internalSelectedCountry = selectedCountry;
          if (selectedCountry === "United Kingdom") internalSelectedCountry = "England";
          if (selectedCountry === "European Union") internalSelectedCountry = "EU";
          if (selectedCountry === "United States") internalSelectedCountry = "USA";
          if (item.textContent.includes("EU") || item.textContent.includes("European Union")) {
            filterEUandPartners(mergedBiData, biData).then(
              (filteredCountryGeoJSON) => {
                deleteCountryLabels(filteredCountryGeoJSON);
                destroyMap();
                drawMap(mergedBiData, filteredCountryGeoJSON, "EU");
                highlightEu(svg, filteredCountryGeoJSON);

                /* highlightPartnership(
                  svg,
                  filteredCountryGeoJSON,
                  item.textContent
                );*/

                const toggleButton = document.getElementById("toggleLabels");
                toggleButton.classList.remove("active");

                //updateLabel(svg, path, filteredCountryGeoJSON);

                populatePartnerships(biData, selectedCountry);
              }
            );
          } else {
            console.log('selectedCountry in ELSE CONDITION', selectedCountry)
            const filteredCountryGeoJSON = filterCountriesByPartner(
              mergedBiData,
              internalSelectedCountry
            );

            deleteCountryLabels(filteredCountryGeoJSON);
            destroyMap();
            drawMap(mergedBiData, filteredCountryGeoJSON, internalSelectedCountry);
            highlightPartnership(svg, filteredCountryGeoJSON, item.textContent);
            const toggleButton = document.getElementById("toggleLabels");
            toggleButton.classList.remove("active");
            //updateLabel(svg, path, filteredCountryGeoJSON);

            populatePartnerships(biData, selectedCountry);
            hideLegend();
          }
        });
      });

      document.querySelectorAll(".bloc-select").forEach((item) => {
        item.addEventListener("click", function () {
          showThirdColumn();
          handleSelection("multilateral", item.textContent);
          const selectedBloc = this.textContent.trim();
          const selectedColor = blocColors[selectedBloc] || "#ccc";
          createBlocGeoJSON(geojsonUrl, multiJsonFilePath, selectedBloc, euGeojsonPath)
            .then((filteredGeoJSON) => {
              deleteCountryLabels(filteredGeoJSON);
              destroyMap();
              
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
              const toggleButton = document.getElementById("toggleLabels");
              // Don't force toggle off - let user control persist
              // Check current state and apply it
              console.log("Toggle button active?", toggleButton.classList.contains("active"));
              if (toggleButton.classList.contains("active")) {
                console.log("Calling addCountryLabels");
                addCountryLabels(filteredGeoJSON);
              }
              populateMultilateral(
                filteredGeoJSON,
                selectedBloc,
                multiJsonData
              );
              hideLegend();
            })
            .catch((error) =>
              console.error("Error processing filtered GeoJSON:", error)
            );
        });
      });
    }
  })
  .catch((error) => console.error("Error processing data:", error));

// --- NUEVO CÓDIGO PARA ZOOM Y MOSTRAR NOMBRES DE PAÍSES --- //

document.getElementById("zoomIn").addEventListener("click", () => {
  zoomIn();
});
document.getElementById("zoomOut").addEventListener("click", () => zoomOut());

// Mostrar/ocultar nombres de países
document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("toggleLabels");
  if (toggleButton) {
    toggleButton.addEventListener("click", function () {
      this.classList.toggle("active");
      const showLabels = this.classList.contains("active");
      if (showLabels) {
        addCountryLabels(filteredGeoJSON);
      } else {
        deleteCountryLabels(filteredGeoJSON);
      }
    });
  } else {
  }
});

// Función para inicializar eventos
function initializeOverlayClick() {
  // Obtén la referencia al div por su ID
  const showScrollable = document.getElementById("showScrollable");

  // Verifica que el div exista antes de agregar el evento
  if (showScrollable) {
    showScrollable.addEventListener("click", function () {
      // Acción al hacer clic en el div
      this.classList.add("hidden");
      //console.log("Overlay clickeado y ocultado");
    });
  } else {
    //console.error("El elemento con ID 'showScrollable' no se encontró.");
  }
}

// Llama a la función cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", initializeOverlayClick);

const buttons = document.querySelectorAll(".accordion-button2");

buttons.forEach((button) => {
  button.addEventListener("click", function () {
    // Removemos la clase 'active' de todos los botones
    buttons.forEach((btn) => btn.classList.remove("active"));

    // Añadimos la clase 'active' al botón que se hizo clic
    this.classList.add("active");
  });
});
document.querySelectorAll("a.list-group-item").forEach((link) => {
  link.addEventListener("click", function (event) {
    event.preventDefault(); // Previene el comportamiento por defecto (desplazamiento hacia arriba)
    // Si quieres realizar alguna acción adicional, como mostrar un contenido relacionado, puedes hacerlo aquí
  });
});

/*
// Detectar clics fuera del tooltip
document.addEventListener("click", function(event) {
	const tooltipElement = document.querySelector(".tooltip2"); // Seleccionamos el tooltip
	const overlayElement = document.querySelector(".overlay");  // Si usas un overlay puedes agregar esta validación
  
	// Si el clic ocurrió fuera del tooltip y del overlay
	if (tooltipElement && !tooltipElement.contains(event.target) && !overlayElement.contains(event.target)) {
	  tooltipElement.style("display", "none");  // Ocultar el tooltip
	}
  });
*/
// Al hacer clic en "Bilateral partnerships", simulamos el clic en el primer botón de la lista "EU"
document
  .querySelector('.accordion-button2[data-bs-target="#flush-collapseOne"]')
  .addEventListener("click", function () {
    const divElement = document.querySelector(".tooltip2");
    // Comprobar si existe el elemento antes de modificar el estilo
    if (divElement) {
      divElement.style.display = "none";
    }
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      // El usuario está en un dispositivo móvil
      showPickerBilateral();
      this.scrollIntoView({ behavior: "smooth", block: "start" });

      const selectedText = document.getElementById("blockNameNowTemp");
      selectedText.innerText = "Bilateral Parnerships";
    } else {
      // El usuario está en una web (escritorio o tablet)
      const firstCountryButton = document.querySelector(".country-select"); // Selecciona el primer botón en la lista de "Bilateral partnerships"
      if (firstCountryButton) {
        firstCountryButton.classList.add("activeDetail");
        firstCountryButton.click(); // Simula un clic en ese botón
      }
    }
  });
// zoomToCountry("CHAD")

// Al hacer clic en "Multilateral partnerships", simulamos el clic en el primer botón de la lista "BRICS Geological Platform"
document
  .querySelector('.accordion-button2[data-bs-target="#flush-collapseTwo"]')
  .addEventListener("click", function () {
    const divElement = document.querySelector(".tooltip2");
    // Comprobar si existe el elemento antes de modificar el estilo
    if (divElement) {
      divElement.style.display = "none";
    }
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      // El usuario está en un dispositivo móvil

      showPickerMultilateral();
      const selectedText = document.getElementById("blockNameNowTemp");
      blockNameNowTemp.innerText = "Multilateral Parnerships";
      this.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      const firstBlocButton = document.querySelector(".bloc-select"); // Selecciona el primer botón en la lista de "Multilateral partnerships"
      if (firstBlocButton) {
        firstBlocButton.classList.add("activeDetail");
        firstBlocButton.click(); // Simula un clic en ese botón
      }
    }
  });

const buttons2 = document.querySelectorAll(".list-group-item");

buttons2.forEach((button) => {
  button.addEventListener("click", function () {
    buttons2.forEach((btn) => btn.classList.remove("activeDetail"));

    this.classList.add("activeDetail");
  });
});

document.getElementById("zoomIn").addEventListener("mouseover", function () {
  const zoomInIcon = this.querySelector("img");

  // Cambiar el ícono de zoom-in al de activado (nuevo SVG)
  zoomInIcon.src = `${themeUrl}/img/icons/zoom-on.svg`;
});

document.getElementById("zoomOut").addEventListener("mouseover", function () {
  const zoomOutIcon = this.querySelector("img");
  // Cambiar el ícono de zoom-out al de activado (nuevo SVG)
  zoomOutIcon.src = `${themeUrl}/img/icons/zoom-out-on.svg`;
});

document.getElementById("zoomOut").addEventListener("mouseout", function () {
  const zoomOutIcon = this.querySelector("img");
  zoomOutIcon.src = `${themeUrl}/img/icons/zoom-out-off.svg`;
});
document.getElementById("zoomIn").addEventListener("mouseout", function () {
  const zoomInIcon = this.querySelector("img");

  // Cambiar el ícono de zoom-in al de activado (nuevo SVG)
  zoomInIcon.src = `${themeUrl}/img/icons/zoom-off.svg`;
});

// document.getElementById("printPage").addEventListener("click", function () {
//   printDiv("#printable");
// });
// function printDiv(divId) {
//   console.log("Generando impresión...");

//   // Verificar si el div existe
//   var divElement = document.querySelector(divId);
//   if (!divElement) {
//     console.error("Elemento no encontrado: " + divId);
//     return;
//   }

//   // Usar html2canvas para generar el canvas
//   html2canvas(divElement)
//     .then(function (canvas) {
//       // Crear una imagen a partir del canvas
//       var imgData = canvas.toDataURL("image/png");

//       // Crear un iframe oculto para imprimir
//       var iframe = document.createElement("iframe");
//       iframe.style.position = "absolute";
//       iframe.style.top = "-10000px"; // Ocultar fuera de la pantalla
//       document.body.appendChild(iframe);

//       var iframeWindow = iframe.contentWindow || iframe.contentDocument;
//       var iframeDoc = iframeWindow.document || iframe.contentDocument;

//       // Pasar la imagen generada al iframe
//       iframeDoc.open();
// 	  iframeDoc.write(`
// 		<!DOCTYPE html>
// 		<html>
// 		<head>
// 		  <title>Mind the Map: Charting Africa’s Critical Mineral Partnerships</title>
// 		  <style>
// 			@page {
// 			  margin: 0; /* Elimina los márgenes de la página */
// 			  size: landscape; /* Forzar orientación landscape */
// 			}
// 			body {
// 			  margin: 0; 
// 			  display: flex;
// 			  flex-direction: column;
// 			  justify-content: center;
// 			  align-items: center;
// 			  height: 100vh;
// 			  overflow: hidden;
// 			}
// 			.title {
// 			  font-size: 12px;
// 			  font-weight: normal;
// 			  margin-bottom: 20px;
// 			  font-family: "RalewayItalic", sans-serif;
// 			}
// 			img {
// 			  max-width: 100%;
// 			  max-height: 100%;
// 			}
// 		  </style>
// 		</head>
// 		<body>
// 		  <img src="${imgData}" alt="Contenido a imprimir" />
// 		</body>
// 		</html>
// 	  `);
//       iframeDoc.close();

//       // Esperar a que el contenido cargue antes de imprimir
//       iframe.onload = function () {
//         iframeWindow.focus();
//         iframeWindow.print();
//         document.body.removeChild(iframe); // Eliminar el iframe después de imprimir
//       };
//     })
//     .catch(function (error) {
//       console.error("Error al generar el canvas:", error);
//     });
// }

if (window.innerWidth <= 768) {
  // Contamos las palabras del texto
  const descriptionText = document.getElementById("descriptionText");

  document.getElementById("descriptionText1").classList.add("hidden");
  document.getElementById("descriptionText3").classList.add("hidden");

  const words = descriptionText.innerText.split(" ");

  // Encontramos la primera parte del texto y lo separamos
  const firstPart = words.slice(0, 500).join(" "); // Agregamos '...' al final de las primeras 33 palabras
  const secondPart = words.slice(500).join(" ");

  // Creamos el botón
  const button = document.createElement("button");
  button.id = "toggleDescription";
  //button.style.marginLeft="6px"

  button.textContent = "   Show more";

  // Insertamos el texto inicial con el botón
  descriptionText.innerHTML = firstPart;
  descriptionText.appendChild(button);

  // Función para alternar entre mostrar más o menos texto
  function toggleText() {
    if (button.textContent === "   Show more") {
      // Mostrar todo el texto sin los tres puntos y cambiar el texto del botón a "Show less"
      descriptionText.innerHTML = firstPart + secondPart; // Eliminar los '...' de firstPart
      descriptionText.appendChild(button);
      //document.getElementById("descriptionText2").classList.remove("hidden");
      document.getElementById("descriptionText3").classList.remove("hidden");
      document.getElementById("descriptionText2").classList.remove("hidden");
      document.getElementById("descriptionText1").classList.remove("hidden");

      document.getElementById("viewLessBtn").style.visibility = "visible";

      button.textContent = "";
    } else {
      console.log("testt");
      // Mostrar solo la primera parte con '...' y cambiar el texto del botón a "Read more"
      descriptionText.innerHTML = firstPart;
      descriptionText.appendChild(button);
      document.getElementById("descriptionText2").classList.add("hidden");
      document.getElementById("descriptionText3").classList.add("hidden");

      button.textContent = "   Show more";
    }
  }
  // Añadimos el evento de alternar el texto y el texto del botón al hacer clic
  button.addEventListener("click", toggleText);

  document.getElementById("viewLessBtn").addEventListener("click", function () {
    console.log("CLICL");
    document.getElementById("descriptionText2").classList.add("hidden");
    document.getElementById("descriptionText3").classList.add("hidden");
    document.getElementById("descriptionText1").classList.add("hidden");

    descriptionText.innerHTML = firstPart;
    descriptionText.appendChild(button);
    document.getElementById("descriptionText2").classList.add("hidden");
    document.getElementById("descriptionText3").classList.add("hidden");

    button.textContent = "   Show more";
  });
} else {
  //document.getElementById("viewLessBtn2").style.visibility = "hidden";

  // document.getElementById("viewMoreBtn").addEventListener("click", function () {
  //   console.log("Prueba");
  //   document.getElementById("descriptionText3").classList.remove("hidden");
  //   document.getElementById("descriptionText2").classList.remove("hidden");

  //   this.style.visibility = "hidden"; // Ocultar el botón después de hacer clic
  //   document.getElementById("viewLessBtn").style.visibility = "visible";
  // });
  // document.getElementById("viewLessBtn").addEventListener("click", function () {
  //   document.getElementById("descriptionText2").classList.add("hidden");
  //   document.getElementById("descriptionText3").classList.add("hidden");

  //   this.style.visibility = "hidden"; // Ocultar el botón después de hacer clic
  //   document.getElementById("viewMoreBtn").style.visibility = "visible";
  // });
}

window.addEventListener("resize", changeButtonText);
window.addEventListener("load", changeButtonText);

function changeButtonText() {
  const buttons = document.querySelectorAll(".accordion-button2");
  buttons.forEach((button) => {
    // Buscar solo el texto del botón, ignorando las imágenes
    const buttonTextNode = Array.from(button.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE
    );

    if (window.innerWidth <= 768) {
      if (button.id === "africaButton") {
        buttonTextNode.nodeValue = "Overview"; // Cambiar solo el texto
      } else if (button.id === "clickable") {
        buttonTextNode.nodeValue = "Bilateral";
      } else if (button.id === "multilateral") {
        buttonTextNode.nodeValue = "Multilateral";
      }
    } else {
      if (button.id === "africaButton") {
        buttonTextNode.nodeValue = "African countries overview";
      } else if (button.id === "clickable") {
        buttonTextNode.nodeValue = "Bilateral partnerships";
      } else if (button.id === "multilateral") {
        buttonTextNode.nodeValue = "Multilateral partnerships";
      }
    }
  });
}

// Obtén el elemento span
const mySpan = document.getElementById("africanCountry");

// Configura el MutationObserver
const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    // console.log("cambio estado");
    if (mutation.type === "childList") {
      const selectedBlock = document.getElementById("blockName");
      console.log("entra aqui");

      // console.log(selectedBlock.textContent);

      if (selectedBlock.textContent.trim() == "African countries Overview") {
        //resetToInitialView();
      } else {
      }
      //simulateCountryClick(svg, filteredGeoJSON, mySpan.textContent);

      //console.log("El texto del span cambió a:", mySpan);
      // Aquí puedes agregar cualquier acción adicional
    }
  }
});

// Observa cambios en los hijos del span (como el texto)
observer.observe(mySpan, { childList: true });

// Función para cambiar el texto del span

// Obtén el elemento span
const mySpan2 = document.getElementById("blockNameTemp");

// Configura el MutationObserver
const observer2 = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      const selectedBlock = document.getElementById("blockName");
      console.log("entra aqui");
      selectedBlock.innerText = mySpan2.textContent.trim();

      if (selectedBlock.textContent.trim() == "African countries overview") {
        //destroyMap();
        //filteredGeoJSON = filterAfrica(mergedBiData, numberData); // Filtra África
        //clearCardContent();
        //addLegend(svg, colorScale); // Añade la leyenda
        //removeThirdColumn(); // Oculta la tercera columna
        resetToInitialView();
      }
      simulateCountryClick(svg, filteredGeoJSON, mySpan.textContent);
      //console.log("El texto del span cambió a:", mySpan);
      // Aquí puedes agregar cualquier acción adicional
    }
  }
});

// Observa cambios en los hijos del span (como el texto)
observer2.observe(mySpan2, { childList: true });

// Función para cambiar el texto del span - with null check
const buttonChangeElement = document.querySelector(".buttonChange");
if (buttonChangeElement) {
  buttonChangeElement.addEventListener("click", () => {
    const randomValue = Math.random(); // Genera un valor aleatorio entre 0 y 1
    const selectedBlock = document.getElementById("blockName").textContent.trim();

    if (selectedBlock === "African countries overview") {
      const africanButton = document.getElementById("africaButton");
      africanButton.click();
    } else if (selectedBlock === "Multilateral Parnerships") {
      const multilateral = document.getElementById("multilateral");
      multilateral.click();
    } else {
      const africanButton = document.getElementById("africaButton");
      africanButton.click();
    }
  });
}

function closeTooltip() {
  // Aquí debes definir cómo quieres ocultar o eliminar el tooltip.
  // Por ejemplo, si el tooltip se encuentra en un contenedor específico:
  const tooltipContainer = document.querySelector("#tooltip-container");
  if (tooltipContainer) {
    tooltipContainer.innerHTML = ""; // Limpia el contenido del tooltip
  }
}
