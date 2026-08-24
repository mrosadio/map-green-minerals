import { width, height, svg, themeUrl } from "./globals.js";

// -- SVG setup --
// Created once at module load time
const mapEl = document.querySelector("#map");
const W = mapEl?.clientWidth || 800;
const H = mapEl?.clientHeight || 500;

// and addCountryLabels() can read the current path for centroid calculations.
export function fitSizeMap(filteredGeoJson) {
  let projection = d3.geoEqualEarth().fitSize([W, H], filteredGeoJson);
  let path = d3.geoPath().projection(projection);

  return path;
}
// let projection = d3
//   .geoEqualEarth()
//   .fitSize([W, H]);
//let path = d3.geoPath().projection(projection);
let g;

//aumentar un parametro para identificar el pais y con ello hacer el zoom mas personalizado para cada uno
export function drawMap(geojson, filteredCountryGeoJSON, partner) {
  //svg.attr("viewBox", `-100 0 1000 600`);
  // In your draw function, read actual dimensions:

  const mapEl = document.querySelector("#map");
  svg.attr("viewBox", getViewBox(mapEl));
  console.log("console svg", mapEl.clientWidth);
  svg.selectAll("path").remove();
  svg.selectAll("text").remove();
  //g = svg.append("g");
  const W = mapEl?.clientWidth;
  const H = mapEl?.clientHeight;
  // Update projection to match new dimensions
  let projection = d3
    .geoMercator()
    .scale(400)
    .translate([W / 2, H / 2]);
  let path = d3.geoPath().projection(projection);

  projection.scale(400).translate([W / 2, H / 2]);
  g = svg.append("g");

  // Eliminar los caminos existentes (opcional, si deseas eliminar los anteriores)
  svg.selectAll("path").remove();
  const filteredCountryNames = new Set(filteredCountryGeoJSON.features.map((d) => d.properties.name));
  const paths = g
    .selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#d3d3d3")
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .on("click", function (event, d) {
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
    .attr("font-size", "5pt") 
    .attr("fill", "black")
    .style("pointer-events", "none")
    .style("opacity", 0) // Start hidden, toggle will show them

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
  d3.selectAll("text").style("opacity", 0); // Ocultar los nombres de los países

  console.log("Paths created for map", paths);
}

let isCountryLabelsVisible = false; // Las etiquetas están no visibles por defecto

export function drawMapWithPartnerColors(svg, /*path,*/ geojsonData, numberData) {

  const mapEl = document.querySelector("#map");
  svg.attr("viewBox", getViewBox(mapEl));
  console.log("console svg", mapEl.clientWidth);
  svg.selectAll("path").remove();
  svg.selectAll("text").remove();
  //g = svg.append("g");
  const W = mapEl?.clientWidth;
  const H = mapEl?.clientHeight;
  // Update projection to match new dimensions
  let path = fitSizeMap(geojsonData);

  const colorScale = d3.scaleQuantize().domain([0, 6]).range(["#F2F2F2", "#FEE2A4", "#FCCA7B", "#FCC12C", "#EA9B0F", "#D68F01", "#9E6604"]);
  const colorScaleShalow = d3.scaleQuantize().domain([0, 6]).range(["#F2F2F2", "#FFF1D4", "#FCE0B1", "#FDDA84", "#F3C471", "#E2B369", "#BC8C46"]);
  const partnerCounts = {};
  numberData.forEach((countryData) => {
    partnerCounts[countryData.africanCountry] = countryData.partnersNo;
  });
  console.log(partnerCounts);

  g = svg.append("g");
  let tooltip = d3.select(".tooltip2");

  if (tooltip.empty()) {
    // Si no hay ningún tooltip existente, crear uno nuevo
    tooltip = d3.select("body").append("div").attr("class", "tooltip2").style("position", "absolute").style("background-color", "white").style("border", "1px solid #ccc").style("border-radius", "4px").style("padding", "10px").style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.2)").style("display", "none");
  } else {
    // Si el tooltip ya existe, actualizar sus estilos
    tooltip.style("position", "absolute").style("background-color", "white").style("border", "1px solid #ccc").style("border-radius", "4px").style("padding", "10px").style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.2)").style("display", "none");
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
    .on("mouseover", function (event, d) {
      const countryName = d.properties.name;
      const countryData = numberData.find((country) => country.africanCountry === countryName);
      const partnerCount = countryData ? countryData.partnersNo : 0;
      if (partnerCount > 0) {
        const partnersList = countryData && countryData.partners ? countryData.partners : [];
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        tooltip.html(`
		  <div style="display: flex; flex-direction: column; width: 135px; position: relative;">
		  
			<div style="display: flex; justify-content: space-between; width: 135px;">
			  <h3 style="margin: 0; font-weight: bold; font-size: 13pt">${countryName}</h3>
			  
			</div>
			<p style="margin: 5px 0; margin-top: 8px; font-size: 11pt">${partnerCount} partner${partnerCount !== 1 ? "s" : ""}</p>
			<ul style="padding: 0; margin: 0; margin-top: 8px; font-size: 11pt;">
			  ${partnersList.map((partner) => `<p style="padding: 0; margin: 0;">${partner}</p>`).join("")}
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
      } else {
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (!isMobile) {
          tooltip.html(`
			  <div style="display: flex; flex-direction: column; width: 135px; position: relative;">
				<div style="display: flex; justify-content: space-between; align-items: center; width: 135px;">
				  <h3 style="margin: 0; font-weight: bold; font-size: 13pt;">${countryName}</h3>
			  
				</div>
			  </div>
			`);
          tooltip.style("display", "block");
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
        g.selectAll(".hover-icon").transition().duration(300).style("opacity", 0).remove();
      } else {
        g.selectAll(".city-label")
          .filter((label) => label.properties.name === d.properties.name)
          .transition()
          .duration(300)
          .style("opacity", 0);

        g.selectAll(".hover-icon").transition().duration(300).style("opacity", 0).remove();
      }
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        g.selectAll(".city-label")
          .filter((label) => label.properties.name === d.properties.name)
          .transition()
          .duration(300)
          .style("opacity", 1);
      }
    })
    .on("mousemove", function (event, d) {
      const countryName = d.properties.name;
      if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;

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
          centerX = window.innerWidth / 2 - tooltipWidth / 2 + 30;
          centerY = window.innerHeight / 2 - tooltipHeight / 2 + 200; // Agregar 200px más abaj
        } else {
          centerX = window.innerWidth / 2 - tooltipWidth / 2 + 30;
          centerY = window.innerHeight / 2 - tooltipHeight / 2 + 200; // Agregar 200px más abaj
        }
        // Posicionar el tooltip al centro de la pantalla (ajustado)
        tooltip.style("left", centerX + "px").style("top", centerY + "px");
      } else {
        //console.log("City name on mousemove:", countryName);
        if (countryName == "South Africa" || countryName == "Zambia") {
          tooltip
            .style("left", event.pageX + 10 + "px") // Desplazar un poco a la derecha
            .style("top", event.pageY - 250 + "px"); // Desplazar un poco hacia abajo
        } else {
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

  //svg.call(zoom2);
  d3.selectAll("text").style("opacity", 0); // Ocultar los nombres de los países
  d3.selectAll("image").style("opacity", 0); // Mostrar los íconos
}
function getViewBox(el) {
  const w = el.clientWidth;
  const h = el.clientHeight;
  // Phone
  if (w < 576) {
    svg.attr("preserveAspectRatio", "xMidYMin meet");
    return "-200 -225 700 900";
  }
  // Laptop
  if (w < 1024) {
    svg.attr("preserveAspectRatio", "xMidYMin meet");
    //return "-150 150 775 1000";
    return `-150 -25 925 600`;
  }
  //viewBox="-250 -125 1150 600"
  //svg.attr("preserveAspectRatio", "xMidYMin meet");
  //return `0 0 ${el.clientWidth} ${el.clientHeight}`;
  // large screens
  return `0 0 ${w} ${h}`;
}


//export { path };
