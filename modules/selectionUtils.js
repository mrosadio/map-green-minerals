import { svg, themeUrl } from "./globals.js";
import { euMemberNames } from "./mapUtils.js";

export function highlightPartnership(svg, filteredGeoJSON, itemSelected) {
  svg.selectAll("path").interrupt("highlight").transition("highlight").duration(200).attr("fill", "#E8E4DF").attr("stroke", "white").attr("stroke-width", 0.5);
  const partnerCountries = new Set(filteredGeoJSON.features.map((f) => f.properties.name));
  // Step 2: then apply new highlights
  svg
    .selectAll("path")
    .filter((d) => partnerCountries.has(d.properties?.name))
    .interrupt("highlight")
    .transition("highlight")
    .duration(400)
    .attr("fill", (d) => (d.properties.name === itemSelected ? "#D4891A" : "#F0C97A"));
}

export function highlightEu(svg, filteredGeoJSON) {
  svg.selectAll("path").interrupt("highlight").transition("highlight").duration(200).attr("fill", "#E8E4DF").attr("stroke", "white").attr("stroke-width", 0.5);

  const euCountries = new Set(euMemberNames); // eu member states
  const africanPartners = new Set(filteredGeoJSON.features.map((f) => f.properties.name).filter((name) => !euCountries.has(name)));

  svg
    .selectAll("path")
    .filter((d) => euCountries.has(d.properties?.name))
    .interrupt("highlight")
    .transition("highlight")
    .duration(400)
    .attr("fill", "#D4891A");

  svg
    .selectAll("path")
    .filter((d) => africanPartners.has(d.properties?.name))
    .interrupt("highlight")
    .transition("highlight")
    .duration(400)
    .attr("fill", "#F0C97A");
}

export function populatePartnerships(biData, selectedCountry) {
  // Normalize display names to internal keys used in data
  if (selectedCountry === "England") {
    selectedCountry = "United Kingdom";
  }
  let internalSelected = selectedCountry;
  if (selectedCountry === "European Union") internalSelected = "EU";
  if (selectedCountry === "United States") internalSelected = "USA";
  let partnerSelected;
  const infoPartnerContainer = document.querySelector(".card.partnership");
  infoPartnerContainer.innerHTML = "";
  const bilateralPartner = document.createElement("h2");
  bilateralPartner.classList.add("card-title", "card-title-fixed", "partner-select", "h2");
  if (internalSelected === "EU") {
    partnerSelected = biData.find((country) => country.nonafrican && country.nonafrican.name === internalSelected);
    bilateralPartner.innerHTML = `European Union`;
  } else {
    partnerSelected = biData.find((country) => country.nonafrican === internalSelected);
    // Display friendly names for special cases
    if (internalSelected === "USA") {
      bilateralPartner.innerHTML = `United States`;
    } else {
      bilateralPartner.innerHTML = `${partnerSelected.nonafrican}`;
    }
  }
  bilateralPartner.classList.add("partner-header");

  infoPartnerContainer.appendChild(bilateralPartner);

  const partnerSubTitle = document.createElement("h4");
  partnerSubTitle.classList.add("card-subTitle");
  partnerSubTitle.innerHTML = "Partnerships with African countries";

  infoPartnerContainer.appendChild(partnerSubTitle);

  // Crear el contenedor para el contenido con scroll
  const scrollContainer = document.createElement("div");
  scrollContainer.classList.add("custom-scroll"); // Se añade 'custom-scroll' aquí

  scrollContainer.style.maxHeight = "100%"; // Establecer el alto máximo para hacer scroll
  scrollContainer.style.overflowY = "auto"; // Activar el scroll vertical
  scrollContainer.style.marginTop = "0px"; // Espacio entre el título y el contenido

  infoPartnerContainer.appendChild(scrollContainer);

  // Sort partnerships: newest to oldest based on year/date
  const sortedPartnerships = [...partnerSelected.partnership].sort((a, b) => {
    // Function to get the most recent date from a partnership
    const getMostRecentDate = (partner) => {
      if (partner.year) {
        return partner.year;
      }
      if (partner.agreements && partner.agreements.length > 0) {
        // Find the most recent date from all agreements
        const dates = partner.agreements
          .map((ag) => ag.year)
          .filter((year) => year) // Remove null/undefined
          .sort((d1, d2) => new Date(d2) - new Date(d1)); // Sort descending
        return dates[0]; // Return the most recent
      }
      return null;
    };

    const dateA = getMostRecentDate(a);
    const dateB = getMostRecentDate(b);

    if (!dateA || !dateB) return 0;

    // Convert to Date objects and sort newest first
    return new Date(dateB) - new Date(dateA);
  });

  sortedPartnerships.forEach((partner) => {
    ////console.log('Partnership in container', partner)
    const partnershipCard = document.createElement("div");
    partnershipCard.classList.add("card-body", "partner", "custom-scroll");
    const partnerTitle = document.createElement("h5");
    partnerTitle.classList.add("card-title", "list-partners");
    partnerTitle.innerHTML = `${partner.country}`;
    partnershipCard.appendChild(partnerTitle);
    if (partner.agreements) {
      //console.log("Multiple agreements", partner.agreements);

      // Sort agreements by date: newest to oldest
      const sortedAgreements = [...partner.agreements].sort((a, b) => {
        if (!a.year || !b.year) return 0;
        return new Date(b.year) - new Date(a.year);
      });

      sortedAgreements.forEach((agreement, index) => {
        const partnerAgreement = document.createElement("h5");
        partnerAgreement.classList.add("card-subtitle", "agreement");
        partnerAgreement.style.paddingBottom = "0px"; // Aplicar la fuente personalizada
        partnerAgreement.innerHTML = agreement.typeAgreement ? `${agreement.typeAgreement}` : "";
        partnershipCard.appendChild(partnerAgreement);

        const time = document.createElement("p");
        time.classList.add("card-text", "mb-1", "agreement-time");
        time.innerHTML = `Signed: ${agreement.year}`;

        partnershipCard.appendChild(time);
        const access = document.createElement("p");
        access.classList.add("card-text", "mb-1", "access-line");

        if (agreement.linkAgreement) {
          access.innerHTML = `Access: <svg class="access-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> <a href="${agreement.linkAgreement}" target="_blank" class="access-link">Publicly available</a>`;
        } else {
          const sourceLink = agreement.sources ? ` <a href="${agreement.sources}" target="_blank" class="access-link">View source</a>` : "";
          access.innerHTML = `Access: <svg class="access-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 0 1 6 0v3H9z"/></svg> Not publicly available${sourceLink}`;
        }

        partnershipCard.appendChild(access);

        let tagsContainer;
        const agreementAreasCoop = Array.isArray(agreement.areasCoop) ? agreement.areasCoop : agreement.areasCoop ? [agreement.areasCoop] : [];

        if (agreementAreasCoop.length > 0) {
          const areasTitleContainer = document.createElement("div");
          areasTitleContainer.style.display = "flex";
          areasTitleContainer.style.alignItems = "center";
          areasTitleContainer.style.flexWrap = "wrap";
          areasTitleContainer.style.gap = "5px";

          const areasTitle = document.createElement("span");
          areasTitle.classList.add("card-text", "mb-1");
          areasTitle.style.paddingBottom = "0px";
          areasTitle.style.marginBottom = "0px";
          areasTitle.style.marginRight = "10px";
          areasTitle.innerHTML = "Areas of cooperation:";
          areasTitleContainer.appendChild(areasTitle);

          const tagsContainer = document.createElement("div");
          tagsContainer.style.display = "flex";
          tagsContainer.style.flexWrap = "wrap";
          tagsContainer.style.alignItems = "center";
          tagsContainer.style.gap = "5px";

          const rightElement = document.querySelector(".right");
          rightElement.style.marginTop = "0px";

          const firstShortElement = agreementAreasCoop.find((area) => area.length <= 60);
          const remainingAreas = agreementAreasCoop.filter((area) => area !== firstShortElement);
          const reorderedAreas = firstShortElement ? [firstShortElement, ...remainingAreas] : remainingAreas;

          reorderedAreas.forEach((area, index) => {
            const tag = document.createElement("span");
            tag.classList.add("tag");
            tag.textContent = area;
            tag.style.whiteSpace = "nowrap";

            tag.style.backgroundColor = colorMap[area] || "#000000";
            tag.style.color = "black";
            tag.style.padding = "2px 10px";
            tag.style.borderRadius = "4px";
            tag.style.fontSize = "9pt";

            tag.addEventListener("mouseover", function () {
              tag.style.boxSizing = "border-box";
              tag.style.border = "1px solid black";
            });
            tag.addEventListener("mouseleave", function () {
              tag.style.border = "none";
            });
            tag.addEventListener("touchstart", function () {
              tag.style.boxSizing = "border-box";
              tag.style.border = "1px solid black";
            });

            tag.addEventListener("mouseenter", function () {
              const tooltip = document.createElement("span");
              tooltip.classList.add("tooltip");
              tooltip.textContent = tooltipMap[area];
              tooltip.style.lineHeight = "1.5";
              tag.appendChild(tooltip);

              tooltip.style.visibility = "visible";
              tooltip.style.opacity = "1";

              const tooltipRect = tooltip.getBoundingClientRect();
              const container = document.querySelector(".custom-scroll");
              const containerRect = container.getBoundingClientRect();

              if (tooltipRect.right > containerRect.right) {
                const overflowX = tooltipRect.right - containerRect.right;
                tooltip.style.transform = `translateX(calc(-15% - ${overflowX}px))`;
              }

              if (tooltipRect.left < containerRect.left) {
                const overflowLeft = containerRect.left - tooltipRect.left;
                tooltip.style.transform = `translateX(calc(-15% + ${overflowLeft}px))`;
              }
            });

            tag.addEventListener("mouseleave", function () {
              const tooltip = tag.querySelector(".tooltip");
              if (tooltip) {
                tag.removeChild(tooltip);
              }
            });

            if (index === 0 && firstShortElement === area) {
              areasTitleContainer.appendChild(tag);
            } else {
              tagsContainer.appendChild(tag);
            }
          });
          areasTitleContainer.appendChild(tagsContainer);
          partnershipCard.appendChild(areasTitleContainer);
          if (index < partner.agreements.length - 1) {
            const line = document.createElement("hr");
            line.classList.add("line_black");
            if (tagsContainer) tagsContainer.style.marginBottom = "0.75rem";

            line.style.border = "0.5px solid gray";
            line.style.margin = "6px 0 3px 0";
            line.style.padding = "0px";

            partnershipCard.appendChild(line);
          }
        }
      });
    } else if (partner.typeAgreement) {
      const partnerAgreement = document.createElement("h5");
      partnerAgreement.classList.add("card-subtitle", "agreement");
      partnerAgreement.innerHTML = partner.typeAgreement ? `${partner.typeAgreement}` : "";
      partnershipCard.appendChild(partnerAgreement);

      const time = document.createElement("p");
      time.classList.add("card-text", "mb-1");
      time.innerHTML = `Signed: ${partner.year}`;
      time.style.fontSize = "11pt";
      time.style.paddingBottom = "0px";

      partnershipCard.appendChild(time);

      const access = document.createElement("p");
      access.classList.add("card-text", "mb-1", "access-line");
      access.style.fontSize = "11pt";
      access.style.paddingBottom = "0px";

      if (partner.linkAgreement) {
        access.innerHTML = `Access: <svg class="access-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> <a href="${partner.linkAgreement}" target="_blank" class="access-link">Publicly available</a>`;
      } else {
        const sourceLink = partner.sources ? ` <a href="${partner.sources}" target="_blank" class="access-link">View source</a>` : "";
        access.innerHTML = `Access: <svg class="access-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 0 1 6 0v3H9z"/></svg> Not publicly available${sourceLink}`;
      }
      partnershipCard.appendChild(access);

      const partnerAreasCoop = Array.isArray(partner.areasCoop) ? partner.areasCoop : partner.areasCoop ? [partner.areasCoop] : [];

      if (partnerAreasCoop.length > 0) {
        const areasTitleContainer = document.createElement("div");
        areasTitleContainer.style.display = "flex";
        areasTitleContainer.style.alignItems = "center";
        areasTitleContainer.style.flexWrap = "wrap";
        areasTitleContainer.style.gap = "5px";

        const areasTitle = document.createElement("span");
        areasTitle.classList.add("card-text", "mb-1");
        areasTitle.style.paddingBottom = "0px";
        areasTitle.style.marginBottom = "0px";
        areasTitle.style.marginRight = "10px";
        areasTitle.innerHTML = "Areas of cooperation:";
        areasTitleContainer.appendChild(areasTitle);

        const tagsContainer = document.createElement("div");
        tagsContainer.style.display = "flex";
        tagsContainer.style.flexWrap = "wrap";
        tagsContainer.style.alignItems = "center";
        tagsContainer.style.gap = "5px";

        const rightElement = document.querySelector(".right");
        rightElement.style.marginTop = "0px";

        // Obtener el primer elemento que tenga 25 letras o menos y luego el resto en su orden original
        const firstShortElement = partnerAreasCoop.find((area) => area.length <= 60);
        const remainingAreas = partnerAreasCoop.filter((area) => area !== firstShortElement);
        const reorderedAreas = firstShortElement ? [firstShortElement, ...remainingAreas] : remainingAreas;

        reorderedAreas.forEach((area, index) => {
          const tag = document.createElement("span");
          tag.classList.add("tag");
          tag.textContent = area;
          tag.style.whiteSpace = "nowrap";

          tag.style.backgroundColor = colorMap[area] || "#000000";
          tag.style.color = "black";
          tag.style.padding = "2px 10px";
          tag.style.borderRadius = "4px";
          tag.style.fontSize = "9pt";

          tag.addEventListener("mouseover", function () {
            tag.style.boxSizing = "border-box";
            tag.style.border = "1px solid black";
          });
          tag.addEventListener("mouseleave", function () {
            tag.style.border = "none";
          });
          tag.addEventListener("touchstart", function () {
            tag.style.boxSizing = "border-box";
          });

          tag.addEventListener("mouseenter", function () {
            // Crear el tooltip
            const tooltip = document.createElement("span");
            tooltip.classList.add("tooltip");
            tooltip.textContent = tooltipMap[area];
            tooltip.style.lineHeight = "1.5";
            tag.appendChild(tooltip);

            tooltip.style.visibility = "visible";
            tooltip.style.opacity = "1";

            const tooltipRect = tooltip.getBoundingClientRect();
            const container = document.querySelector(".custom-scroll");
            const containerRect = container.getBoundingClientRect();
            console.log(containerRect);
            if (tooltipRect.right > containerRect.right) {
              console.log("mas grande");

              const overflowX = tooltipRect.right - containerRect.right;
              tooltip.style.transform = `translateX(calc(-15% - ${overflowX}px))`;
            }
            if (tooltipRect.left < containerRect.left) {
              const overflowLeft = containerRect.left - tooltipRect.left;
              tooltip.style.transform = `translateX(calc(-15% + ${overflowLeft}px))`;
            }
          });

          tag.addEventListener("mouseleave", function () {
            const tooltip = tag.querySelector(".tooltip");
            if (tooltip) {
              tag.removeChild(tooltip);
            }
          });

          if (index === 0 && firstShortElement === area) {
            areasTitleContainer.appendChild(tag);
          } else {
            tagsContainer.appendChild(tag);
          }
        });
        areasTitleContainer.appendChild(tagsContainer);
        partnershipCard.appendChild(areasTitleContainer);
      }
    }
    scrollContainer.appendChild(partnershipCard);
    infoPartnerContainer.appendChild(scrollContainer);
  });
}
const tooltipMap = {
  "Economic linkages and diversification": "Provisions broadly relating to the integration of value chains, fostering economic diversification and creating business models that strengthen trade, governance and infrastructure development.",

  "Capital mobilization": "Provisions focused on securing and attracting funds for infrastructure, encouraging private sector investment, promoting joint ventures, fostering new business models and promoting joint initiatives, including public-private partnerships, to strengthen trade and resource exploration.",

  "Sustainable governance": "Collaborative efforts to promote responsible production, integrate Environmental, Social, Governance (ESG) criteria, strengthen governance and ensure traceability through sustainable legislation, policies and industry standards.",

  "Knowledge and capacity building": "Initiatives such as the establishment of data banks, the sharing of expertise, joint research initiatives, specialized training and the exchange of technical knowledge to enhance skills, foster innovation and support sustainable development in the sector.",

  "Extraction and exploration partnerships": "Joint efforts in mineral exploration, secure supply chain development, technical expertise exchange and geological infrastructure creation through public-private partnerships to promote sustainable mining and investment.",
};
const colorMap = {
  "Economic linkages and diversification": "#75D1D1",
  "Capital mobilization": "#F4A27D",
  "Sustainable governance": "#E3F5F5",
  "Knowledge and capacity building": "#FFDC94",
  "Extraction and exploration partnerships": "#EF9CAF",
};
export function populateMultilateral(multiData, selectedBloc, multiJsonData) {
  console.log("Multi data to populate", multiData);
  console.log("Multi JSON data to populate", multiJsonData);
  console.log("Selected bloc", selectedBloc);

  selectedBloc = selectedBloc.replace(/\s+/g, " ");
  let blocCountries = multiData.features;
  const infoMultiContainer = document.querySelector(".card");
  infoMultiContainer.innerHTML = "";
  const rightElement = document.querySelector(".right");
  rightElement.style.marginTop = "0px"; // Ajusta el valor según lo que necesites

  // Crear y agregar el contenedor con scroll para todo el contenido relacionado
  const scrollContainer = document.createElement("div");
  scrollContainer.classList.add("custom-scroll"); // Se añade la clase para estilos personalizados

  scrollContainer.style.maxHeight = "100%"; // Altura máxima para el contenedor
  scrollContainer.style.overflowY = "auto"; // Habilitar scroll vertical
  scrollContainer.style.marginTop = "0px"; // Espacio entre el título y el contenido
  scrollContainer.style.paddingRight = "18px"; // Espacio entre el título y el contenido

  // Crear y agregar el título principal
  const multiPartner = document.createElement("h2");
  multiPartner.style.borderBottom = "2pt solid #ffb300"; // Línea roja de 2px
  multiPartner.style.paddingBottom = "10px"; // Espacio entre el texto y la línea
  multiPartner.style.fontSize = "22pt";
  multiPartner.style.fontWeight = "bold";

  multiPartner.classList.add("card-title", "card-title-fixed", "partner-select", "mt-3");
  multiPartner.innerHTML = `${selectedBloc}`;
  infoMultiContainer.appendChild(multiPartner);

  //  scrollContainer.appendChild(); // Agregar el título al contenedor con scroll

  // Agregar el texto Lorem Ipsum debajo del título
  const loremText = document.createElement("p");
  loremText.classList.add("card-text", "mt-2");
  loremText.style.fontSize = "11pt";
  loremText.style.paddingLeft = "0rem"; // Aplicar la fuente personalizada

  let nombre = selectedBloc.replace(/\s+/g, " ");

  let des = multiJsonData.find((item) => item.blocName === nombre).description;
  loremText.innerHTML = des;

  console.log(des);
  scrollContainer.appendChild(loremText);

  // Crear el contenedor para el ícono y el enlace
  const iconLinkContainer = document.createElement("div");
  iconLinkContainer.style.display = "flex";
  iconLinkContainer.style.alignItems = "center"; // Alinear verticalmente el icono y el enlace
  iconLinkContainer.style.justifyContent = "flex-start"; // Alinear a la izquierda

  // Crear el ícono
  const icon = document.createElement("img");
  icon.src = `${themeUrl}/img/icons/web.svg`; // Ruta del ícono PNG
  icon.alt = "Icono de acceso"; // Texto alternativo
  icon.style.height = "20px";
  iconLinkContainer.appendChild(icon); // Añadir el ícono al contenedor

  // Crear el enlace de "Source"
  const blocSource = document.createElement("a");
  blocSource.classList.add("card-link");
  blocSource.href = multiJsonData.find((item) => item.blocName === nombre).link;
  blocSource.target = "_blank";
  // Aplicar estilos al enlace
  blocSource.style.textDecoration = "none"; // Eliminar el subrayado
  blocSource.style.fontSize = "11pt"; // Tamaño de fuente
  blocSource.style.marginLeft = "4px"; // Tamaño de fuente
  blocSource.style.color = "#0071BC"; // Cambiar color
  blocSource.innerHTML = "View agreement";

  iconLinkContainer.appendChild(blocSource); // Añadir el enlace al contenedor

  // Añadir el contenedor de icono y enlace al contenedor principal
  scrollContainer.appendChild(iconLinkContainer);

  // Variable global para rastrear el tooltip activo
  let activeTooltip = null;
  const isMobile = window.innerWidth <= 768; // Si el ancho de la pantalla es menor o igual a 768px, asumimos que es móvil

  // Check if EU exists in the original data and filter display accordingly
  const blocData = multiJsonData.find((item) => item.blocName === nombre);
  let displayCountries = blocCountries;

  if (blocData && blocData.members && typeof blocData.members === "object" && !Array.isArray(blocData.members)) {
    if (blocData.members.EU && blocData.members.countries) {
      // Get list of countries that are explicitly in the "countries" array
      const explicitCountries = blocData.members.countries;
      const euCountriesList = blocData.members.EU;

      // Display: countries from "countries" array + EU, but exclude EU countries that are NOT in "countries" array
      displayCountries = blocCountries.filter((country) => {
        const name = country.properties.name;
        // Keep if it's EU
        if (name === "EU") return true;
        // Keep if it's in the explicit countries list
        if (explicitCountries.includes(name)) return true;
        // Keep if it's NOT an EU country (e.g., non-EU countries)
        if (!euCountriesList.includes(name)) return true;
        // Exclude EU countries that are NOT explicitly in the countries list
        return false;
      });
    }
  }

  // Crear la lista de países con íconos y tooltips
  displayCountries.forEach((country, index) => {
    // Crear el contenedor del país
    const countryItem = document.createElement("div");
    countryItem.className = "country-item";

    // Agregar el nombre del país
    const countryName = document.createElement("p");
    // Normalize display name for special programmatic keys
    let displayName = country.properties.name;
    if (displayName === "England") displayName = "United Kingdom";
    if (displayName === "EU") displayName = "European Union";
    if (displayName === "USA") displayName = "United States";

    if (displayName.length > 15) {
      countryName.className = "country-name2 long-name";
      const parts = displayName.split(" ");
      if (parts.length > 1) {
        const firstPart = parts.slice(0, Math.ceil(parts.length / 2.5)).join(" ");
        const secondPart = parts.slice(Math.ceil(parts.length / 2.5)).join(" ");
        countryName.innerHTML = `• ${firstPart}<br>&nbsp;&nbsp;&nbsp;${secondPart}`;

        // Crear el contenedor del tooltip
        const tooltipMultiContainer = document.createElement("div");
        tooltipMultiContainer.className = "tooltipMulti-container long-name-tooltip";
        tooltipMultiContainer.style.position = "relative";
        tooltipMultiContainer.style.display = "inline-block";
        tooltipMultiContainer.style.marginLeft = "5px"; // Margen para separar el ícono del nombre

        // Ícono de información
        const infoIcon = document.createElement("img");
        infoIcon.src = `${themeUrl}/img/icons/info.svg`; // Ruta al archivo SVG
        infoIcon.className = "info-icon";

        // Crear el tooltip
        const tooltipMulti = document.createElement("div");
        tooltipMulti.className = "tooltipMulti";

        // Botón "X" para cerrar el tooltip
        const closeBtn = document.createElement("button");
        closeBtn.className = "close-btn";
        closeBtn.innerHTML = "✖";
        closeBtn.style.paddingRight = "5px";
        closeBtn.style.paddingTop = "2px";

        closeBtn.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevenir que el clic afecte a otros eventos
          tooltipMulti.classList.remove("active");
          activeTooltip = null;
        });

        // Texto dentro del tooltip
        const tooltipText = document.createElement("div");
        tooltipText.innerText = "Description";
        tooltipText.style.marginRight = "15px";

        tooltipMulti.appendChild(closeBtn);
        tooltipMulti.appendChild(tooltipText);

        tooltipMultiContainer.appendChild(infoIcon);
        tooltipMultiContainer.appendChild(tooltipMulti);
      } else {
        countryName.innerHTML = `• ${displayName}`;
      }
    } else {
      countryName.className = "country-name";
      countryName.innerHTML = `• ${displayName}`;

      // Crear el contenedor del tooltip para nombres cortos
      const tooltipMultiContainer = document.createElement("div");
      tooltipMultiContainer.className = "tooltipMulti-container";
      tooltipMultiContainer.style.position = "relative";

      // Ícono de información
      const infoIcon = document.createElement("img");
      infoIcon.src = `${themeUrl}/img/icons/info.svg`; // Ruta al archivo SVG
      infoIcon.className = "info-icon";

      // Crear el tooltip
      const tooltipMulti = document.createElement("div");
      tooltipMulti.className = "tooltipMulti";

      // Botón "X" para cerrar el tooltip
      const closeBtn = document.createElement("button");
      closeBtn.className = "close-btn";
      closeBtn.innerHTML = "✖";
      closeBtn.style.paddingRight = "5px";
      closeBtn.style.paddingTop = "2px";

      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevenir que el clic afecte a otros eventos
        tooltipMulti.classList.remove("active");
        activeTooltip = null;
      });

      // Texto dentro del tooltip
      const tooltipText = document.createElement("div");
      tooltipText.innerText = "Description";
      tooltipText.style.marginRight = "15px";
      tooltipMulti.appendChild(closeBtn);
      tooltipMulti.appendChild(tooltipText);
      tooltipMultiContainer.appendChild(infoIcon);
      tooltipMultiContainer.appendChild(tooltipMulti);
    }
    // Agregar evento de clic al ícono
    const infoIcon = countryItem.querySelector(".info-icon");
    if (infoIcon) {
      infoIcon.addEventListener("click", (e) => {
        e.stopPropagation(); // Evitar cerrar el tooltip al hacer clic en el ícono
        const tooltipMulti = infoIcon.nextElementSibling;

        if (activeTooltip && activeTooltip !== tooltipMulti) {
          // Cerrar el tooltip activo si es diferente
          activeTooltip.classList.remove("active");
        }

        // Alternar el tooltip actual
        if (tooltipMulti.classList.contains("active")) {
          tooltipMulti.classList.remove("active");
          activeTooltip = null;
        } else {
          tooltipMulti.classList.add("active");
          activeTooltip = tooltipMulti;
        }
      });
    }
  });
  // Cerrar tooltips al hacer clic en cualquier otra parte de la página
  document.addEventListener("click", () => {
    if (activeTooltip) {
      activeTooltip.classList.remove("active");
      activeTooltip = null;
    }
  });
  // Finalmente, agregar el contenedor con scroll al DOM
  infoMultiContainer.appendChild(scrollContainer);
}
export function clearCardContent() {
  const infoMultiContainer = document.querySelector(".card.partnership");

  if (infoMultiContainer) {
    infoMultiContainer.innerHTML = ""; // Elimina todo el contenido
  } else {
    ////console.warn("Elemento con clase 'card' no encontrado.");
  }
}
export function highlightBloc(svg, filteredGeoJSON, selectedColor, selectedBloc) {
  const blocCountries = new Set(filteredGeoJSON.features.map((f) => f.properties.name));
  svg
    .selectAll("path")
    .interrupt("highlight")
    .transition("highlight")
    .duration(400)
    .attr("fill", (d) => (blocCountries.has(d.properties.name) ? selectedColor : "#E8E4DF"));
}

// export function highlightEuClubBloc(svg, filteredGeoJSON) {

// }
