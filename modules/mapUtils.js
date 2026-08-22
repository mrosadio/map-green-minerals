import { width, height, svg, themeUrl } from "./globals.js";

let projection = d3
  .geoMercator()
  .scale(400)
  .translate([width / 2, height / 2]);
let path = d3.geoPath().projection(projection);
let zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);
let g;
let banderaClick = false;
let banderaBoton = false;
let zoomEndTimeout;

let originalOverview = null;
// Función que maneja el evento de zoom

function zoomed(event) {
  const { transform } = event;
  g.attr("transform", transform);
  g.attr("stroke-width", 1 / transform.k);

  // Ocultar el tooltip inmediatamente al comenzar el movimiento del zoom
  const tooltip = d3.select(".tooltip2");
  tooltip.style("display", "none").style("pointer-events", "none"); 
  console.log(banderaClick);
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  if (isMobile) {
    // Mostrar nombres de países si el zoom es 3 o más
    if (transform.k >= 2) {
      d3.selectAll(".city-label")
        .transition()
        .duration(300)
        .style("opacity", 1); // Hacer visibles las etiquetas
    /*  if (banderaClick) {
        banderaClick = false;
      }*/
    } else {
      d3.selectAll(".city-label")
        .transition()
        .duration(300)
        .style("opacity", 0); // Ocultar las etiquetas
    }
  } else {
    setTimeout(() => {
      if (!banderaBoton) {
        tooltip.style("display", "block").style("pointer-events", "auto"); // Hacer visible el tooltip
        setTimeout(() => {
          banderaClick = false;
        }, 500); // Retraso adicional
      }
    }, 500); // Retraso para sincronizar con la animación de la etiqueta
  }

  // Reiniciar el temporizador del "último movimiento del zoom"
  clearTimeout(zoomEndTimeout);
  zoomEndTimeout = setTimeout(() => {
    if (banderaClick) {
      tooltip.style("display", "block").style("pointer-events", "auto"); // Hacer visible el tooltip

      banderaClick = false;
    }
    // Aquí se ejecuta la lógica cuando se detecta el último movimiento del zoom
  }, 300); // 300 ms después de que el usuario haya terminado el movimiento del zoom
}

function zoomedBorrar(event) {
  const { transform } = event;
  g.attr("transform", transform);
  g.attr("stroke-width", 1 / transform.k);
  // Ocultar el tooltip inmediatamente al comenzar el movimiento del zoom
  const tooltip = d3.select(".tooltip2");
  tooltip.style("display", "none").style("pointer-events", "none");
  console.log(banderaClick);
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  if (isMobile) {
    // Mostrar nombres de países si el zoom es 3 o más
    console.log(transform.k);
    if (transform.k >= 2) {
      d3.selectAll(".city-label")
        .transition()
        .duration(300)
        .style("opacity", 1); // Hacer visibles las etiquetas
      if (banderaClick) {
        // Mostrar el tooltip después de la animación del zoom
        setTimeout(() => {
          //   selectedText.innerText = "Bilateral Parnerships";
          tooltip.style("display", "block").style("pointer-events", "auto"); // Hacer visible el tooltip
          // Usamos una segunda función de `setTimeout` para asegurarnos de que `banderaClick` cambie después de haber mostrado el tooltip
          setTimeout(() => {
            banderaClick = false;
            //console.log("MUESTRAAA" + banderaClick);
          }, 30); // Retraso adicional para asegurar que se haya completado la animación del tooltip
        }, 1000); // Retraso para sincronizar con la animación de la etiqueta
      }
    } else {
      d3.selectAll(".city-label")
        .transition()
        .duration(300)
        .style("opacity", 0); // Ocultar las etiquetas
    }
  } else {
    setTimeout(() => {
      if (!banderaBoton) {
        tooltip.style("display", "block").style("pointer-events", "auto"); // Hacer visible el tooltip
        // Usamos una segunda función de `setTimeout` para asegurarnos de que `banderclick` cambie después de haber mostrado el tooltip
        setTimeout(() => {
          banderaClick = false;
          //    console.log("MUESTRAAA");
        }, 500); // Retraso adicional para asegurar que se haya completado la animación del tooltip
      }
    }, 500); // Retraso para sincronizar con la animación de la etiqueta
  }
}
//aumentar un parametro para identificar el pais y con ello hacer el zoom mas personalizado para cada uno
export function drawMap(geojson, filteredCountryGeoJSON, partner) {
  banderaBoton = true;
  // Establecer el viewBox inicial
  svg.attr("viewBox", `-100 0 1000 600`);

  // Crear un grupo <g> para contener los paths
  g = svg.append("g");

  // Eliminar los caminos existentes (opcional, si deseas eliminar los anteriores)
  svg.selectAll("path").remove();
  const filteredCountryNames = new Set(
      filteredCountryGeoJSON.features.map((d) => d.properties.name) 
  );
  // Agregar los caminos de GeoJSON dentro del grupo <g>
  const paths = g
    .selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path) // Aquí asumo que tienes una variable 'path' definida previamente
    .attr("fill", "#d3d3d3")
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .on("click", function (event, d) {
      // Comprobar si el país está en la lista de países filtrados
      if (filteredCountryNames.has(d.properties.name)) {
        clicked(event, d); // Solo llamar al método clicked si está en los países filtrados
      }
    });
  const labels = g
    .selectAll("text")
    .data(filteredCountryGeoJSON.features)
    .enter()
    .append("text")
    .attr("class", "city-label")
    .attr("x", (d) => path.centroid(d)[0])
    .attr("y", (d) => path.centroid(d)[1])
    .attr("text-anchor", "middle")
    .attr("font-size", function (d) {
      if (partner === "EU") {
        return "3pt";
      } else if (partner === "Russia") {
        return "2.5pt";
      } else if (partner === "USA") {
        return "4pt";
      } else if (partner === "EU") {
        return "1pt";
      } else if (partner === "BRICS Geological Platform") {
        return "4pt";
      } else if (partner === "Minerals Security Partnership") {
        return "4pt";
      } else if (partner === "EU Raw Materials Club") {
        return "3pt";
      } else if (partner === "Energy Resource Governance Initiative") {
        return "3pt";
      } else if (partner === "Indo-Pacific Economic Framework for Prosperity (IPEF) Critical Minerals Dialogue") {
        return "5pt";
      } else {
        return "5pt";
      }
    })
    .attr("fill", "black")
    .style("pointer-events", "none") // Ignora eventos del mouse
    .style("opacity", 0) // Start hidden, toggle will show them

    .each(function (d) {
      const countryName = d.properties.name;
        const displayCountryName =
          countryName === "EU" ? "European Union" : countryName;
        const name = displayCountryName.toUpperCase();
        const wrappedText = wrapText(displayCountryName.toUpperCase(), 15); // Ajusta el número de caracteres por línea
      // Crear un tspan para cada línea de texto
      const textElement = d3.select(this);
      wrappedText.forEach((line, i) => {
        if (partner == "BRICS Geological Platform") {
          if (name == "Russia") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 10)
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "CHINA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 8)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "INDIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 8) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "EGYPT") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + -3)
              .attr("y", path.centroid(d)[1] + i * 8 + 1) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "ETHIOPIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 3) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "UNITED ARAB EMIRATES") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 5 + 5) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "SOUTH AFRICA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 4) // Ajusta la separación entre líneas
              .text("SOUTH");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 9) // Ajusta la separación entre líneas
              .text("AFRICA");
          } else {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          }
        } else if (partner == "United Kingdom") {
          if (name == "ENGLAND") {
          textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text("UNITED ");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 7) // Ajusta la separación entre líneas
              .text(" KINGDOM");
        } else {
          textElement
            .append("tspan")
            .attr("x", path.centroid(d)[0])
            .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
            .text(line);
        }
      } else if (partner == "Minerals Security Partnership") {
          //Canada. India, Japan, South Korea, Australia
          if (name == "CANADA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 40)
              .attr("y", path.centroid(d)[1] + i * 5 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "SOUTH KOREA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 7)
              .attr("y", path.centroid(d)[1] + i * 8 - 2) // Ajusta la separación entre líneas
              .text("SOUTH");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 7)
              .attr("y", path.centroid(d)[1] + i * 8 + 4) // Ajusta la separación entre líneas
              .text("KOREA");
          } else if (name == "INDIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 6) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "JAPAN") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 10)
              .attr("y", path.centroid(d)[1] + i * 8 + 6) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "AUSTRALIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "SLOVAKIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 25)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text("EUROPEAN UNION");
          } else if (name == "ENGLAND") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text("UNITED ");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 7) // Ajusta la separación entre líneas
              .text(" KINGDOM");
          } else if (name == "USA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 15)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text("UNITED STATES");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 15)
              .attr("y", path.centroid(d)[1] + i * 8 + 15) // Ajusta la separación entre líneas
              .text("OF AMERICA");
          } else {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 4) // Ajusta la separación entre líneas
              .text(line);
          } //EU Raw Materials Club
        } else if (partner == "EU Raw Materials Club") {
          if (name == "PORTUGAL") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 10)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "SPAIN") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "FRANCE") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 35)
              .attr("y", path.centroid(d)[1] + i * 8 - 30) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "IRELAND") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 0)
              .attr("y", path.centroid(d)[1] + i * 8 - 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "NETHERLANDS") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 10)
              .attr("y", path.centroid(d)[1] + i * 8 - 2) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "BELGIUM") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 2)
              .attr("y", path.centroid(d)[1] + i * 8 - 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "GERMANY") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 2)
              .attr("y", path.centroid(d)[1] + i * 8 - 2) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "LUXEMBOURG") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 13)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "AUSTRIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 4)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "DENMARK") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 3)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "POLAND") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 5) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "BULGARIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 3) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "CROATIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 2)
              .attr("y", path.centroid(d)[1] + i * 8 - 2) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "SLOVAKIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 3)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "SLOVENIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "CYPRUS") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 4) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "HUNGARY") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 3) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "SWEDEN") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 6)
              .attr("y", path.centroid(d)[1] + i * 8 + 3) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "LATVIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "FINLAND") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 2)
              .attr("y", path.centroid(d)[1] + i * 8 + 6) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "CZECH REPUBLIC") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 2)
              .attr("y", path.centroid(d)[1] + i * 8 + -1) // Ajusta la separación entre líneas
              .text("CZECH");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 2)
              .attr("y", path.centroid(d)[1] + i * 8 + 4) // Ajusta la separación entre líneas
              .text("REPUBLIC");
          } else {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          }
        } else if (partner == "Energy Resource Governance Initiative") {
          if (name == "AUSTRALIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 4) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "CANADA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 40)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "USA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 15)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text("UNITED STATES");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 15)
              .attr("y", path.centroid(d)[1] + i * 8 + 15) // Ajusta la separación entre líneas
              .text("OF AMERICA");
          } else if (name == "BOTSWANA") {
            //Botswana
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 3)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "PERU") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 4)
              .attr("y", path.centroid(d)[1] + i * 8 + 3) // Ajusta la separación entre líneas
              .text(line);
          }
        } else if (partner == "Indo-Pacific Economic Framework for Prosperity (IPEF) Critical Minerals Dialogue") {
          if (name == "INDIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 8) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "THAILAND") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "VIETNAM") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 30)
              .attr("y", path.centroid(d)[1] + i * 8 + 20) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "MALAYSIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 6)
              .attr("y", path.centroid(d)[1] + i * 8 - 5) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "INDONESIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 2.5) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "AUSTRALIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "FIJI") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 65)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "NEW ZEALAND") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 10)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "JAPAN") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 6)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "SINGAPORE") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "PHILIPPINES") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "USA") {
            // SOLO PARA RUSIA
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text("UNITED STATES");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 17) // Ajusta la separación entre líneas
              .text("OF AMERICA");
          }
        } else if (partner == "EU") {
          if (name == "DEMOCRATIC REPUBLIC OF THE CONGO") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 1)
              .attr("y", path.centroid(d)[1] + i * 6 - 5) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "ZAMBIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "NAMIBIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 3) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "RWANDA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 10)
              .attr("y", path.centroid(d)[1] + i * 8 + 3) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "SLOVAKIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 45)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text("EUROPEAN UNION");
          } else if (name == "SOUTH AFRICA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 4) // Ajusta la separación entre líneas
              .text("SOUTH");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 9) // Ajusta la separación entre líneas
              .text("AFRICA");
          }
        } else if (partner == "Critical Minerals Mapping Initiative") {
          if (name == "CANADA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 35)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "AUSTRALIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "USA") {
            // SOLO PARA RUSIA
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text("UNITED STATES");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 17) // Ajusta la separación entre líneas
              .text("OF AMERICA");
          }
        } else if (
          partner ==
          "France-Germany-Italy Joint Communique on Critical Raw Materials"
        ) {
          if (name == "FRANCE") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 40)
              .attr("y", path.centroid(d)[1] + i * 8 - 35) // Ajusta la separación entre líneas
              .text(line);
          } else {
            // SOLO PARA RUSIA
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          }
        } else if (partner == "Conference on Critical Materials and Minerals") {
          if (name == "CANADA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 35)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "JAPAN") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 10)
              .attr("y", path.centroid(d)[1] + i * 8 + 6) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "AUSTRALIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "USA") {
            // SOLO PARA RUSIA
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text("UNITED STATES");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 17) // Ajusta la separación entre líneas
              .text("OF AMERICA");
          } else if (name == "SLOVAKIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 25)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text("EUROPEAN UNION");
          } else {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 4) // Ajusta la separación entre líneas
              .text(line);
          }
        } else if (partner == "Sustainable Critical Mineral Alliance") {
          if (name == "CANADA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 35)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "AUSTRALIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "USA") {
            // SOLO PARA RUSIA
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text("UNITED STATES");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 17) // Ajusta la separación entre líneas
              .text("OF AMERICA");
          } else if (name == "FRANCE") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 - 15) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "ENGLAND") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text("UNITED ");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 7) // Ajusta la separación entre líneas
              .text(" KINGDOM");
          } else {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          }
        } else if (partner == "Lobito Corridor Project") {
          if (name == "USA") {
            // SOLO PARA RUSIA
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text("UNITED STATES");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 17) // Ajusta la separación entre líneas
              .text("OF AMERICA");
          } else if (name == "SLOVAKIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 25)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text("EUROPEAN UNION");
          } else if (name == "ANGOLA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 3) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "DEMOCRATIC REPUBLIC OF THE CONGO") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 1)
              .attr("y", path.centroid(d)[1] + i * 7 - 5) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "ZAMBIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 9)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 4) // Ajusta la separación entre líneas
              .text(line);
          }
        } else if (partner == "Portugal") {
          if (name == "MOZAMBIQUE") {
            textElement
            .append("tspan")
            .attr("x", path.centroid(d)[0] + 13)
            .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
            .text(line);
          } else {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          }
        } else if (partner == "East Timor") {
          if (name == "MOZAMBIQUE") {
            textElement
            .append("tspan")
            .attr("x", path.centroid(d)[0] + 13)
            .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
            .text(line);
          } else {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          }
        } else if (partner == "Canada") { 
          if (name == "CANADA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 40)
              .attr("y", path.centroid(d)[1] + i * 5 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          }
        }
        
        else {
          if (name == "ZAMBIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 9)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "MALAWI") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 12)
              .attr("y", path.centroid(d)[1] + i * 8 + 7) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "MOZAMBIQUE") {
            if (partner == " Russia") {
              textElement
                .append("tspan")
                .attr("x", path.centroid(d)[0] + 12)
                .attr("y", path.centroid(d)[1] + i * 8 + 13) // Ajusta la separación entre líneas
                .text(line);
            }
            if (partner == "India") {
              textElement
                .append("tspan")
                .attr("x", path.centroid(d)[0] + 12)
                .attr("y", path.centroid(d)[1] + i * 8 + 13) // Ajusta la separación entre líneas
                .text(line);
            }
            if (partner == "China") {
              textElement
                .append("tspan")
                .attr("x", path.centroid(d)[0] + 30)
                .attr("y", path.centroid(d)[1] + i * 8 - 5) // Ajusta la separación entre líneas
                .text(line);
            }
          } else if (name == "SOUTH AFRICA") {
            // SOLO PARA RUSIA
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text("SOUTH");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 5)
              .attr("y", path.centroid(d)[1] + i * 8 + 6) // Ajusta la separación entre líneas
              .text("AFRICA");
          } else if (name == "IVORY COAST") {
            // SOLO PARA RUSIA
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8 - 2) // Ajusta la separación entre líneas
              .text("IVORY");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8 + 5) // Ajusta la separación entre líneas
              .text("COAST");
          } else if (name == "MALI") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 10)
              .attr("y", path.centroid(d)[1] + i * 8 + 6) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "RWANDA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 10)
              .attr("y", path.centroid(d)[1] + i * 8 + 3) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "TOGO") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 4)
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "NAMIBIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 3) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "ANGOLA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 3) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "ZIMBABWE") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 1)
              .attr("y", path.centroid(d)[1] + i * 8 + 1) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "USA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 33) // Ajusta la separación entre líneas
              .text("UNITED STATES");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 40) // Ajusta la separación entre líneas
              .text("OF AMERICA");
          } else if (name == "DEMOCRATIC REPUBLIC OF THE CONGO") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 1)
              .attr("y", path.centroid(d)[1] + i * 7 - 5) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "MAURITANIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8 + 12) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "UGANDA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8 + 5) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "SOMALIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 10)
              .attr("y", path.centroid(d)[1] + i * 8 + 15) // Ajusta la separación entre líneas
              .text(line);
          } else {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          }

          //PERSONALIZADO
          if (partner == "Russia") {
            if (name == "MOZAMBIQUE") {
              textElement
                .append("tspan")
                .attr("x", path.centroid(d)[0] + 13)
                .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
                .text(line);
            } else if (name == "ZIMBABWE2") {
              textElement
                .append("tspan")
                .attr("x", path.centroid(d)[0] + 0)
                .attr("y", path.centroid(d)[1] + i * 8 + 2) // Ajusta la separación entre líneas
                .text(line);
            }
          }
        }
      });
    });

  // Función para envolver el texto en varias líneas
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

    if (currentLine) lines.push(currentLine); // Añadir la última línea

    return lines;
  }
  // Crear el comportamiento de zoom
  // aca se debe hacer los if para cada pais JORGE PAREDES
  // const zoom = d3.zoom().scaleExtent([1, 10]).on("zoom", zoomed);

  const zoom = d3
    .zoom()
    .scaleExtent([1, 10]) // Límite de escala (zoom mínimo y máximo)
    .translateExtent([
      [-60, -100],
      [900, 650],
    ]) // Límite de traslación (pan)
    .on("zoom", zoomed);

  // Llamar al comportamiento de zoom sobre el SVG
  svg.call(zoom);
  d3.selectAll("text").style("opacity", 0); // Ocultar los nombres de los países

  // Función que maneja el evento de zoom
  function zoomed(event) {
    const { transform } = event;
    // Aplicar la transformación de zoom al grupo <g>
    g.attr("transform", transform);
    // Ajustar el grosor de las líneas al hacer zoom
    g.attr("stroke-width", 1 / transform.k);

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Mostrar nombres de países si el zoom es 4
      if (transform.k >= 3) {
        d3.selectAll(".city-label")
          .transition()
          .duration(300)
          .style("opacity", 1); // Hacer visibles las etiquetas
      } else {
        d3.selectAll(".city-label")
          .transition()
          .duration(300)
          .style("opacity", 0); // Ocultar las etiquetas
      }
    }
  }
  function clicked(event, d) {
    const [[x0, y0], [x1, y1]] = path.bounds(d);
    event.stopPropagation();
    svg
      .transition()
      .duration(1200)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(
            Math.min(
              8,
              0.9 / Math.max((x1 - x0) / width / 2, (y1 - y0) / height)
            ) * 0.7
          )
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
        d3.pointer(event, svg.node())
      );
  }

  console.log("Paths created for map", paths);
}
export function destroyMap() {
  // Selecciona todo dentro del SVG y lo elimina
  svg.selectAll("*").remove();
  //console.log("Map destroyed, all paths and elements removed.");
}
let currentZoom = "";
let isCountryLabelsVisible = false; // Las etiquetas están no visibles por defecto

export function drawMapWithPartnerColors(svg, path, geojsonData, numberData) {
  banderaBoton = false;

  svg.selectAll("path").remove();
  //  svg.attr("viewBox", `150 0 800 600`);
  //console.log("GeoJSON features:", geojsonData.features);
  console.log("Number data", numberData);
  svg.selectAll("*").remove();

  // Reiniciar la proyección a la configuración inicial (centrada en África)
  projection = d3
    .geoMercator()
    .scale(400) // Escala inicial que se estableció para África
    .translate([450, 300]);
  path = d3.geoPath().projection(projection);

  const zoom2 = d3
    .zoom()
    .scaleExtent([1, 8]) // Límite de escala (zoom mínimo y máximo)
    .translateExtent([
      [-0, -0],
      [1040, 700],
    ]) // Límite de traslación (pan)
    .on("zoom", zoomed);

  const colorScale = d3
    .scaleQuantize()
    //   .domain([0, d3.max(numberData, (d) => d.partnersNo)])
    .domain([0, 6])

    .range([
      "#F2F2F2",
      "#FEE2A4",
      "#FCCA7B",
      "#FCC12C",
      "#EA9B0F",
      "#D68F01",
      "#9E6604",
    ]);
  const colorScaleShalow = d3
    .scaleQuantize()
    .domain([0, 6])
    .range([
      "#F2F2F2",
      "#FFF1D4",
      "#FCE0B1",
      "#FDDA84",
      "#F3C471",
      "#E2B369",
      "#BC8C46",
    ]);
  const partnerCounts = {};
  numberData.forEach((countryData) => {
    partnerCounts[countryData.africanCountry] = countryData.partnersNo;
  });
  console.log(partnerCounts);

  svg.selectAll("g").remove();

  g = svg.append("g");
  let tooltip = d3.select(".tooltip2");

  // Si no existe, crearlo; si existe, simplemente actualizar sus estilos
  if (tooltip.empty()) {
    // Si no hay ningún tooltip existente, crear uno nuevo
    tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip2")
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("padding", "10px")
      .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.2)")
      .style("display", "none");
  } else {
    // Si el tooltip ya existe, actualizar sus estilos
    tooltip
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("padding", "10px")
      .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.2)")
      .style("display", "none");
  }

  const countries = g
    .selectAll("path")
    .data(geojsonData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", (d) => {
      const countryName = d.properties.name;
      const partnerCount = partnerCounts[countryName] || 0; // Si no hay socios, partnerCount será 0
      //console.log(d.properties.name + "__" + partnerCount);

      return colorScale(partnerCount); // Color inicial
    })
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    //.attr("font-family", "Roboto")

    .on("click", clicked)
    .on("mouseover", function (event, d) {
      const countryName = d.properties.name;
      const countryData = numberData.find(
        (country) => country.africanCountry === countryName
      );
      const partnerCount = countryData ? countryData.partnersNo : 0;
      if (countryName === "Western Sahara") {
        return; // Skip tooltip for Western Sahara
      }
      if (partnerCount > 0) {
        const partnersList =
          countryData && countryData.partners ? countryData.partners : [];
        // console.log(partnersList);
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(
          navigator.userAgent
        );

        // Generar el contenido del tooltip

        tooltip.html(`
		  <div style="display: flex; flex-direction: column; width: 135px; position: relative;">
		  
			<div style="display: flex; justify-content: space-between; width: 135px;">
			  <h3 style="margin: 0; font-weight: bold; font-size: 13pt">${countryName}</h3>
			  
			</div>
			<p style="margin: 5px 0; margin-top: 8px; font-size: 11pt">${partnerCount} partner${
          partnerCount !== 1 ? "s" : ""
        }</p>
			<ul style="padding: 0; margin: 0; margin-top: 8px; font-size: 11pt;">
			  ${partnersList
          .map((partner) => `<p style="padding: 0; margin: 0;">${partner}</p>`)
          .join("")}
			</ul>
		  </div>
		`);

        // Uso
        if (window.innerWidth <= 768) {
          tooltip.style("display", "none");
        } else {
          tooltip.style("display", "block");
        }

        // tooltip.style("display", "block");
        tooltip.style("pointer-events", "none");

        d3.select(this).transition().duration(300).style("opacity", 1);

        // Cambiar el color con colorScaleShalow
        const partnerCountShalow = partnerCount;
        d3.select(this).attr("fill", colorScaleShalow(partnerCountShalow));

        // Ocultar el nombre de la ciudad
        g.selectAll(".city-label")
          .filter((label) => label.properties.name === d.properties.name)
          .transition()
          .duration(300)
          .style("opacity", 0)
          .style("pointer-events", "none"); // Ignora eventos del mouse
        // Calcular el área del país
        const area = d3.geoArea(d);
        const areaInSquareKm = (area * 510072000) / (4 * Math.PI); // Convierte el área en fracción de la esfera a km²
        /* console.log(
		`Country: ${countryName}, Area: ${areaInSquareKm.toFixed(2)} km²`
	  );*/
        if (!isMobile) {
          //       console.log(countryName);

          if (areaInSquareKm.toFixed(2) < 250000) {
            console.log(countryName);

            // Mostrar el ícono en el centro de la ciudad
            g.append("image")
              .attr("class", "hover-icon")
              .attr("xlink:href", `${themeUrl}/img/icons/noun.svg`)
              .attr("width", 20)
              .attr("height", 20)
              .attr(
                "x",
                countryName == "Malawi"
                  ? path.centroid(d)[0] - 12
                  : path.centroid(d)[0] - 10 // Valor por defecto si no coincide con ninguna condición
              )
              .attr(
                "y",
                countryName == "Malawi"
                  ? path.centroid(d)[1] - 15
                  : path.centroid(d)[1] - 20 // Valor por defecto si no coincide con ninguna condición
              )
              .style("pointer-events", "none") // Ignora eventos del mouse
              .style("opacity", 0)
              .transition()
              .duration(300)
              .style("opacity", 1);
          } else {
            // Mostrar el ícono en el centro de la ciudad
            g.append("image")
              .attr("class", "hover-icon")
              .attr("xlink:href", `${themeUrl}/img/icons/noun.svg`)
              .attr("width", 20)
              .attr("height", 20)
              .attr(
                "x",
                countryName == "Morocco"
                  ? path.centroid(d)[0] - 0
                  : countryName == "Zambia"
                  ? path.centroid(d)[0] - 20
                  : path.centroid(d)[0] - 10 // Valor por defecto si no coincide con ninguna condición
              )
              .attr(
                "y",
                countryName == "Morocco"
                  ? path.centroid(d)[1] - 30
                  : countryName == "Zambia"
                  ? path.centroid(d)[1] - 10
                  : path.centroid(d)[1] - 10 // Valor por defecto si no coincide con ninguna condición
              )
              .style("pointer-events", "none") // Ignora eventos del mouse
              .style("opacity", 0)
              .transition()
              .duration(300)
              .style("opacity", 1);
          }
        }
      } else {
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(
          navigator.userAgent
        );
        if (!isMobile) {
          tooltip.html(`
			  <div style="display: flex; flex-direction: column; width: 135px; position: relative;">
				<div style="display: flex; justify-content: space-between; align-items: center; width: 135px;">
				  <h3 style="margin: 0; font-weight: bold; font-size: 13pt;">${countryName}</h3>
			  
				</div>
			  </div>
			`);
          tooltip.style("display", "block");
          //  tooltip.style("pointer-events", "none");

          d3.select(this).transition().duration(300).style("opacity", 1);

          // Cambiar el color con colorScaleShalow
          const partnerCountShalow = partnerCount;
          d3.select(this).attr("fill", colorScaleShalow(partnerCountShalow));

          // Ocultar el nombre de la ciudad
          g.selectAll(".city-label")
            .filter((label) => label.properties.name === d.properties.name)
            .transition()
            .duration(300)
            .style("opacity", 0);
        }
      }
    })
    .on("mouseout", function (event, d) {
      const countryName = d.properties.name;
      const partnerCount = partnerCounts[countryName] || 0; // Obtener el número de socios

      // Volver al color original con colorScale
      d3.select(this).attr("fill", colorScale(partnerCount));

      tooltip.style("display", "none");

      d3.select(this).transition().duration(300).style("opacity", 1);

      // Restaurar la visibilidad de los nombres de las ciudades
      if (isCountryLabelsVisible) {
        g.selectAll(".city-label")
          .filter((label) => label.properties.name === d.properties.name)
          .transition()
          .duration(300)
          .style("opacity", 1);

        // Ocultar el ícono
        g.selectAll(".hover-icon")
          .transition()
          .duration(300)
          .style("opacity", 0)
          .remove();
      } else {
        g.selectAll(".city-label")
          .filter((label) => label.properties.name === d.properties.name)
          .transition()
          .duration(300)
          .style("opacity", 0);

        g.selectAll(".hover-icon")
          .transition()
          .duration(300)
          .style("opacity", 0)
          .remove();
      }
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
      );
      if (isMobile) {
        g.selectAll(".city-label")
          .filter((label) => label.properties.name === d.properties.name)
          .transition()
          .duration(300)
          .style("opacity", 1);
      }
    })
    .on("mousemove", function (event, d) {
      // Mostrar el nombre de la ciudad en la consola
      const countryName = d.properties.name;
      //console.log("City name on mousemove:", countryName);

      if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        //console.log("City name on mousemove:", countryName);
        const userAgent =
          navigator.userAgent || navigator.vendor || window.opera;

        // Calcular las posiciones para centrar el tooltip
        const tooltipWidth = tooltip.node().offsetWidth;
        const tooltipHeight = tooltip.node().offsetHeight;
        let centerX;
        let centerY;
        if (/android/i.test(userAgent)) {
          //console.log("android");

          centerX = window.innerWidth / 2 - tooltipWidth / 2 + 0;
          centerY = window.innerHeight / 2 - tooltipHeight / 2 + 200; // Agregar 200px más abaj
        } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
          // console.log("IOS");

          centerX = window.innerWidth / 2 - tooltipWidth / 2 + 30;
          centerY = window.innerHeight / 2 - tooltipHeight / 2 + 200; // Agregar 200px más abaj
        } else {
          // console.log("android");

          centerX = window.innerWidth / 2 - tooltipWidth / 2 + 30;
          centerY = window.innerHeight / 2 - tooltipHeight / 2 + 200; // Agregar 200px más abaj
        }

        //console.log(centerY);

        // Posicionar el tooltip al centro de la pantalla (ajustado)
        tooltip.style("left", centerX + "px").style("top", centerY + "px");
      } else {
        //console.log("City name on mousemove:", countryName);
        if (countryName == "South Africa" || countryName == "Zambia") {
          tooltip
            .style("left", event.pageX + 10 + "px") // Desplazar un poco a la derecha
            .style("top", event.pageY - 250 + "px"); // Desplazar un poco hacia abajo
        } else {
          // Posicionar el tooltip mientras se mueve el mouse
          tooltip
            .style("left", event.pageX + 10 + "px") // Desplazar un poco a la derecha
            .style("top", event.pageY + 10 + "px");
        }
      }
    });

  const labels = g
    .selectAll("text")
    .data(geojsonData.features)
    .enter()
    .append("text")
    .attr("class", "city-label")
    .attr("x", (d) => path.centroid(d)[0])
    .attr("y", (d) => path.centroid(d)[1])
    .attr("text-anchor", "middle")
    .style("font-size", "5pt")
    .attr("font-family", "RalewayMedium")
    .attr("fill", "black")
    .style("opacity", function (d) {
      const countryName = d.properties.name;
      const partnerCount = partnerCounts[countryName] || 0;
      return partnerCount > 0 ? 1 : 0; // Solo muestra si hay acuerdos
    })
    .each(function (d) {
      const countryName = d.properties.name;
      const partnerCount = partnerCounts[countryName] || 0;
      if (partnerCount > 0) {
        const name = countryName.toUpperCase();
        const wrappedText = wrapText(name, 13); // Ajusta el número de caracteres por línea

        // Crear un tspan para cada línea de texto
        const textElement = d3.select(this);
        wrappedText.forEach((line, i) => {
          if (name == "SENEGAL") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 40)
              .attr("y", path.centroid(d)[1] + i * 8 + 5) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "GUINEA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 40)
              .attr("y", path.centroid(d)[1] + i * 8 + 8) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "IVORY COAST") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 35) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "SOMALIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "GUINEA BISSAU") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 35)
              .attr("y", path.centroid(d)[1] + i * 8 + 6) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "MALI") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 20)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "ALGERIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "LIBYA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 0)
              .attr("y", path.centroid(d)[1] + i * 8 + 5) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "RWANDA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 15)
              .attr("y", path.centroid(d)[1] + i * 8 + 3) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "ZAMBIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 8)
              .attr("y", path.centroid(d)[1] + i * 8 + 12) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "MALAWI") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 7)
              .attr("y", path.centroid(d)[1] + i * 8 + 2) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "SOUTH AFRICA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 10)
              .attr("y", path.centroid(d)[1] + i * 8 + 0) // Ajusta la separación entre líneas
              .text("SOUTH");
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] - 10)
              .attr("y", path.centroid(d)[1] + i * 8 + 7) // Ajusta la separación entre líneas
              .text("AFRICA");
          } else if (name == "MOZAMBIQUE") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 14)
              .attr("y", path.centroid(d)[1] + i * 8 + 10) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "NAMIBIA") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8 + 5) // Ajusta la separación entre líneas
              .text(line);
          } else if (name == "MADAGASCAR") {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0] + 15)
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          } else {
            textElement
              .append("tspan")
              .attr("x", path.centroid(d)[0])
              .attr("y", path.centroid(d)[1] + i * 8) // Ajusta la separación entre líneas
              .text(line);
          }
        });
      }
    });

  // Función para envolver el texto en varias líneas
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
    if (currentLine) lines.push(currentLine); // Añadir la última línea
    return lines;
  }

  svg.call(zoom2);
  d3.selectAll("text").style("opacity", 0); // Ocultar los nombres de los países
  d3.selectAll("image").style("opacity", 0); // Mostrar los íconos

  function clicked(event, d) {
    const tooltip = d3.select(".tooltip2");
    const countryName = d.properties.name;
    const partnerCount = partnerCounts[countryName] || 0; // Número de acuerdos del país
    console.log("CLICKKKK");
    banderaClick = true;
    console.log(banderaClick);

    if (partnerCount === 0) {
      // No hacer nada si el país no tiene acuerdos
      console.log(`${countryName} no tiene acuerdos, no se hará zoom.`);
      return;
    }
    d3.select(this).dispatch("mouseover", { bubbles: true });

    d3.select(this).dispatch("mousemove", { bubbles: true });

    tooltip.style("display", "none");
    banderaClick = true;
    const [[x0, y0], [x1, y1]] = path.bounds(d);
    svg
      .transition()
      .duration(1200)
      .call(
        zoom2.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(
            Math.min(
              200,
              0.9 / Math.max((x1 - x0) / width / 2, (y1 - y0) / height)
            ) * 1
          )
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
        d3.pointer(event, svg.node())
      );
  }
}

function updateProjection(scale, center, translation) {
  //console.log('PROJECTION in function', projection)
  projection = d3
    .geoNaturalEarth1()
    .scale(scale)
    .center(center)
    .translate(translation);
  path = d3.geoPath().projection(projection);
  svg.selectAll("path").attr("d", path);
}

//se modifico esta seccion para identificar por cada pais y realizar la proyeccion de cada item y personalizarlo
export function handleSelection(type, item) {
  // console.log(type);
  //console.log(item);
  // console.log("cesar");
  //  console.log("input FOR HANDLE SELECTOR", width);
  //alert(item.trim())
  console.log(item);
  if (item.trim() == "EU") {
    updateProjection(350, [20, 0], [width / 1.5, height / 1.43]);
  } else if (item == "Saudi Arabia") {
    updateProjection(550, [20, 0], [width / 2, height / 1.6]);
  } else if (item == "United Arab Emirates") {
    updateProjection(580, [20, 0], [width / 3.2, height / 2]);
  } else if (item == "India") {
    updateProjection(450, [20, 0], [width / 4, height / 2]);
  } else if (item == "South Korea") {
    updateProjection(400, [20, 5], [width / 5, height / 2]);
  } else if (item == "Japan") {
    updateProjection(350, [20, 0], [width / 7, height / 1.8]);
  } else if (item == "China") {
    updateProjection(310, [20, 0], [width / 3.5, height / 1.5]);
  } else if (item == "Indonesia") {
    updateProjection(350, [20, 0], [width / 5, height / 1.7]);
  } else if (item == "Russia") {
    updateProjection(200, [40, 0], [width / 1.7, height / 2]);
  } else if (item == "USA") {
    updateProjection(350, [0, 0], [width / 1.4, height / 1.3]);
  } else if (item == "Turkey") {
    updateProjection(550, [20, 5], [width / 2, height / 1.3]);
  } else if (item == "EU Raw Materials Club") {
    updateProjection(550, [20, 10], [width / 1.35, height / 1.15]);
  } else if (item == "Indo-Pacific Economic Framework for Prosperity (IPEF) Critical Minerals Dialogue") {
    updateProjection(210, [30, 20], [width / 2, height / 2]);
  } else if (
    item == "France-Germany-Italy Joint Communique on Critical Raw Materials"
  ) {
    updateProjection(450, [20, 20], [width / 1.5, height / 2]);
  } else if (item == "Lobito Corridor Project") {
    updateProjection(340, [20, 20], [width / 1.2, height / 2]);
  } else {
    updateProjection(210, [20, 0], [width / 2, height / 2]);
  }
  // if (type === "bilateral" || type === "multilateral") {
  //   updateProjection(210, [0, 0], [width / 2.2, height / 2]);
  // } else {
  //   updateProjection(450, [20, 0], [width / 2, height / 2]);
  // }
}

export function addCountryLabels2(geojsonData) {
  const countriesWithPartners = geojsonData.features.filter((feature) => {
    return feature.properties.partnersNo && feature.properties.partnersNo > 0;
  });
  svg.selectAll("text").remove();
  svg
    .selectAll("text")
    .data(countriesWithPartners)
    .enter()
    .append("text")
    .attr("transform", (d) => {
      const centroid = path.centroid(d);
      return `translate(${centroid})`;
    })
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("fill", "black")
    .text((d) => (d.properties.name === "EU" ? "European Union" : d.properties.name));
}

export function addCountryLabels() {
  isCountryLabelsVisible = true;
  const textElements = d3.selectAll("text");
  textElements.transition().duration(500).style("opacity", 1); // Show the labels

  /* `
  if (currentZoom > 2) {
    d3.selectAll("image").transition().duration(500).style("opacity", 0); // Mostrar los íconos
    d3.selectAll("text").transition().duration(500).style("opacity", 1); // Ocultar las etiquetas
  } else {
    d3.selectAll("text").transition().duration(500).style("opacity", 0); // Mostrar las etiquetas
    d3.selectAll("image").transition().duration(500).style("opacity", 1); // Ocultar los íconos
  }*/
}

// Función para ocultar las etiquetas de los nombres de los países
export function deleteCountryLabels() {
  isCountryLabelsVisible = false;
  d3.selectAll("text").transition().duration(500).style("opacity", 0);
  d3.selectAll("image").transition().duration(500).style("opacity", 0); // Hacer invisibles los íconos
}

export function simulateCountryClick(svg, geojsonData, countryName) {
  // Buscar el país correspondiente en los datos GeoJSON
  const countryFeature = geojsonData.features.find(
    (feature) => feature.properties.name === countryName
  );
  if (countryFeature) {
    console.log(countryFeature.properties.name);
    // Seleccionar el elemento <path> correspondiente al país
    const countryPath = svg
      .selectAll("path")
      .filter((d) => d === countryFeature);

    console.log(countryPath);

    if (!countryPath.empty()) {
      // Simular el evento `click` en el elemento
      // Crear un evento de clic simulado
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });

      // Disparar el evento en countryPath
      countryPath.node().dispatchEvent(clickEvent);
      console.error(`click en el country`);
    } else {
      console.error(`No SVG path found for country: ${countryName}`);
    }
  } else {
    //drawMapWithPartnerColors(svg, path, geojsonData, numberData);
    let g = svg.select("g");

    // Verificar si el grupo existe
    if (!g.empty()) {
      // Obtener la transformación actual del grupo, si existe
      let currentTransform = g.attr("transform");
      let translateX = -90; // Valor de traslación en X
      let translateY = 30; // Valor de traslación en Y
      console.error("Aquiiiiiiiiiiiiii");

      if (currentTransform) {
        // Si hay una transformación existente, extraer los valores de traslación
        const translateRegex = /translate\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/;
        const match = translateRegex.exec(currentTransform);

        if (match) {
          translateX = parseFloat(match[1]);
          translateY = parseFloat(match[2]);
        }
      }

      // Ajustar la nueva traslación para mover el grupo hacia la izquierda
      const newTranslateX = translateX - 100; // Mover hacia la izquierda (100 unidades)

      // Aplicar la nueva transformación al grupo
      g.attr("transform", `translate(${newTranslateX}, ${translateY})`);
    } else {
      console.error("No se encontró el grupo <g> para mover.");
    }
  }
}

// Función para hacer zoom in
export function zoomIn() {
  console.log("zONIN");
  svg.transition().duration(500).call(zoom.scaleBy, 1.5); // Incrementa el nivel de zoom
}

// Función para hacer zoom out
export function zoomOut() {
  svg.transition().duration(500).call(zoom.scaleBy, 0.75); // Reduce el nivel de zoom
}
export { path };
