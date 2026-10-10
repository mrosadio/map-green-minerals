import { euMemberNames } from "./mapUtils.js";
import { getMapColors, DUR } from "./colors.js";

const tooltipMap = {
  "Economic linkages and diversification": "Provisions broadly relating to the integration of value chains, fostering economic diversification and creating business models that strengthen trade, governance and infrastructure development.",
  "Capital mobilization": "Provisions focused on securing and attracting funds for infrastructure, encouraging private sector investment, promoting joint ventures, fostering new business models and promoting joint initiatives, including public-private partnerships, to strengthen trade and resource exploration.",
  "Sustainable governance": "Collaborative efforts to promote responsible production, integrate Environmental, Social, Governance (ESG) criteria, strengthen governance and ensure traceability through sustainable legislation, policies and industry standards.",
  "Knowledge and capacity building": "Initiatives such as the establishment of data banks, the sharing of expertise, joint research initiatives, specialized training and the exchange of technical knowledge to enhance skills, foster innovation and support sustainable development in the sector.",
  "Extraction and exploration partnerships": "Joint efforts in mineral exploration, secure supply chain development, technical expertise exchange and geological infrastructure creation through public-private partnerships to promote sustainable mining and investment.",
};
// Colours are the --cat-* tokens in style.css; inline styles accept var()
const colorMap = {
  "Economic linkages and diversification": "var(--cat-teal)",
  "Capital mobilization": "var(--cat-peach)",
  "Sustainable governance": "var(--cat-mist)",
  "Knowledge and capacity building": "var(--cat-sand)",
  "Extraction and exploration partnerships": "var(--cat-rose)",
};
const MECHANISM_LABELS = {
  "direct-cooperation": "Direct state cooperation",
  "private-investment": "Private-investment enabling",
  "infrastructure-for-resources": "Infrastructure-for-resources",
  "security-linked": "Security-linked",
};
const MECHANISM_COLORS = {
  "direct-cooperation": "var(--cat-sand)",
  "private-investment": "var(--cat-teal)",
  "infrastructure-for-resources": "var(--cat-peach)",
  "security-linked": "var(--cat-rose)",
};

function createAreaTag(area, colorMap, tooltipMap) {
  const tag = document.createElement("span");
  tag.classList.add("tag");
  tag.textContent = area;
  tag.style.whiteSpace = "nowrap";
  tag.style.backgroundColor = colorMap[area] || "var(--color-text-primary)";
  tag.style.color = "var(--color-text-primary)";
  tag.style.padding = "var(--space-2xs) var(--space-sm)";
  tag.style.borderRadius = "var(--radius-sm)";
  tag.style.fontSize = "var(--text-xs)";

  tag.addEventListener("mouseover", function () {
    tag.style.boxSizing = "border-box";
    tag.style.border = "1px solid var(--color-text-primary)";
  });
  tag.addEventListener("mouseleave", function () {
    tag.style.border = "none";
  });
  tag.addEventListener("touchstart", function () {
    tag.style.boxSizing = "border-box";
    tag.style.border = "1px solid var(--color-text-primary)";
  });
  tag.addEventListener("mouseenter", function () {
    const tooltip = document.createElement("span");
    tooltip.classList.add("tooltip");
    tooltip.textContent = tooltipMap[area];
    tooltip.style.lineHeight = "var(--lh-snug)";
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
    if (tooltip) tag.removeChild(tooltip);
  });

  return tag;
}
// Computes total/public agreement counts live from a partner's raw
// partnership data. Same linkAgreement/sources logic used to derive
// the static numbers in partnerNarratives.json but computed fresh
// here so it stays accurate even as bilateralPartner.json changes,
// and works for all 29 partners, not just the 12 with narratives
function countAgreements(partnershipList) {
  let total = 0;
  let publicCount = 0;
  partnershipList.forEach((item) => {
    if (item.agreements) {
      item.agreements.forEach((sub) => {
        total += 1;
        if (sub.linkAgreement && sub.linkAgreement.trim()) publicCount += 1;
      });
    } else {
      total += 1;
      if (item.linkAgreement && item.linkAgreement.trim()) publicCount += 1;
    }
  });
  return { total, publicCount };
}

// Renders one agreement's details (type, date, access, areas of cooperation)
// into partnershipCard. Used for both the single-agreement case and each
// item inside a partner's nested agreements array
function renderAgreementDetails(agreement, partnershipCard, needsSeparator = false) {
  const partnerAgreement = document.createElement("h5");
  partnerAgreement.classList.add("card-subtitle", "agreement");
  if (needsSeparator) partnerAgreement.classList.add("agreement-separator");
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

  const areasCoop = Array.isArray(agreement.areasCoop) ? agreement.areasCoop : agreement.areasCoop ? [agreement.areasCoop] : [];
  if (areasCoop.length > 0) {
    const areasTitleContainer = document.createElement("div");
    areasTitleContainer.classList.add("areas-row");

    const areasTitle = document.createElement("span");
    areasTitle.classList.add("card-text", "mb-1", "areas-label");
    areasTitle.innerHTML = "Areas of cooperation:";
    areasTitleContainer.appendChild(areasTitle);

    const tagsContainer = document.createElement("div");
    tagsContainer.classList.add("areas-tags");

    const firstShortElement = areasCoop.find((area) => area.length <= 60);
    const remainingAreas = areasCoop.filter((area) => area !== firstShortElement);
    const reorderedAreas = firstShortElement ? [firstShortElement, ...remainingAreas] : remainingAreas;

    reorderedAreas.forEach((area, index) => {
      const tag = createAreaTag(area, colorMap, tooltipMap);
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

// Badge, rationale paragraph, and transparency bar sourced from
// partnerNarratives.json. Only the 12 report-backed partners have an
// entry, everyone else silently received a fallback treatment
function renderNarrativePanel(container, narrativeEntry, partnershipList) {
  if (narrativeEntry) {
    const badge = document.createElement("span");
    badge.classList.add("mechanism-badge");
    badge.style.backgroundColor = MECHANISM_COLORS[narrativeEntry.mechanism] || "var(--color-border)";
    badge.textContent = MECHANISM_LABELS[narrativeEntry.mechanism] || narrativeEntry.mechanism;
    container.appendChild(badge);

    const rationale = document.createElement("p");
    rationale.classList.add("narrative-rationale");
    rationale.textContent = narrativeEntry.rationale;
    container.appendChild(rationale);
  } else {
    const fallbackNote = document.createElement("p");
    fallbackNote.classList.add("narrative-fallback-note");
    fallbackNote.textContent = "In-depth analysis is available for selected partners. The list below shows all documented agreements.";
    container.appendChild(fallbackNote);
  }
  const { total, publicCount } = countAgreements(partnershipList);
  if (total > 0) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("transparency-bar-wrapper");

    const ratio = publicCount / total;
    const barTrack = document.createElement("div");
    barTrack.classList.add("transparency-bar-track");
    const barFill = document.createElement("div");
    barFill.classList.add("transparency-bar-fill");
    barFill.style.width = `${Math.round(ratio * 100)}%`;
    barTrack.appendChild(barFill);
    wrapper.appendChild(barTrack);

    const label = document.createElement("span");
    label.classList.add("transparency-bar-label");
    label.textContent = `${publicCount} of ${total} agreements publicly documented`;
    wrapper.appendChild(label);

    container.appendChild(wrapper);
  }
}

export function highlightPartnership(svg, filteredGeoJSON, itemSelected) {
  const C = getMapColors();
  svg.selectAll("path").interrupt("highlight").transition("highlight").duration(DUR.fast).attr("fill", C.mapDefault).attr("stroke", C.mapStroke).attr("stroke-width", 0.5);
  const partnerCountries = new Set(filteredGeoJSON.features.map((f) => f.properties.name));
  // Step 2: then apply new highlights
  svg
    .selectAll("path")
    .filter((d) => partnerCountries.has(d.properties?.name))
    .interrupt("highlight")
    .transition("highlight")
    .duration(DUR.med)
    .attr("fill", (d) => (d.properties.name === itemSelected ? C.partnerSelected : C.partnerHighlight));
}

export function highlightEu(svg, filteredGeoJSON) {
  const C = getMapColors();
  svg.selectAll("path").interrupt("highlight").transition("highlight").duration(DUR.fast).attr("fill", C.mapDefault).attr("stroke", C.mapStroke).attr("stroke-width", 0.5);

  const euCountries = new Set(euMemberNames); // eu member states
  const africanPartners = new Set(filteredGeoJSON.features.map((f) => f.properties.name).filter((name) => !euCountries.has(name)));

  svg
    .selectAll("path")
    .filter((d) => euCountries.has(d.properties?.name))
    .interrupt("highlight")
    .transition("highlight")
    .duration(DUR.med)
    .attr("fill", C.partnerSelected);

  svg
    .selectAll("path")
    .filter((d) => africanPartners.has(d.properties?.name))
    .interrupt("highlight")
    .transition("highlight")
    .duration(DUR.med)
    .attr("fill", C.partnerHighlight);
}

export function populatePartnerships(biData, selectedCountry, partnerNarratives = []) {
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
  bilateralPartner.classList.add("card-title", "partner-select");

  let displayName;
  if (internalSelected === "EU") {
    partnerSelected = biData.find((country) => country.nonafrican && country.nonafrican.name === internalSelected);
    displayName = `European Union`;
  } else {
    partnerSelected = biData.find((country) => country.nonafrican === internalSelected);
    displayName = internalSelected === "USA" ? "United States" : partnerSelected.nonafrican;
  }
  bilateralPartner.innerHTML = displayName;
  bilateralPartner.classList.add("partner-header");
  infoPartnerContainer.appendChild(bilateralPartner);

  // Narrative panel (badge, rationale, transparency bar) - is above
  // the agreement list
  const narrativeEntry = partnerNarratives.find((p) => p.partner === displayName);
  renderNarrativePanel(infoPartnerContainer, narrativeEntry, partnerSelected.partnership);

  const partnerSubTitle = document.createElement("h4");
  partnerSubTitle.classList.add("card-subTitle");
  partnerSubTitle.innerHTML = "Partnerships with African countries";
  infoPartnerContainer.appendChild(partnerSubTitle);

  // toggle to view agreements
  const toggleButton = document.createElement("button");
  toggleButton.setAttribute("aria-expanded", "false");        // where the button is created
  toggleButton.classList.add("agreements-toggle");
  toggleButton.type = "button";
  const agreementCount = partnerSelected.partnership.length;
  toggleButton.textContent = `View the ${agreementCount} documented agreement${agreementCount === 1 ? "" : "s"}`;
  infoPartnerContainer.appendChild(toggleButton);

  const scrollContainer = document.createElement("div");
  scrollContainer.classList.add("custom-scroll", "agreements-collapsed", "agreements-list");
  infoPartnerContainer.appendChild(scrollContainer);

  toggleButton.addEventListener("click", () => {
    const isCollapsed = scrollContainer.classList.contains("agreements-collapsed");
    scrollContainer.classList.toggle("agreements-collapsed");
    toggleButton.setAttribute("aria-expanded", String(isCollapsed)); // it was collapsed, so it's expanded now
    toggleButton.textContent = isCollapsed ? `Hide agreements` : `View the ${agreementCount} documented agreement${agreementCount === 1 ? "" : "s"}`;
  });

  // Sort partnerships: newest to oldest based on year/date
  const sortedPartnerships = [...partnerSelected.partnership].sort((a, b) => {
    // Function to get the most recent date from a partnership
    const getMostRecentDate = (partner) => {
      if (partner.year) return partner.year;
      if (partner.agreements && partner.agreements.length > 0) {
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
    return new Date(dateB) - new Date(dateA);
  });

  sortedPartnerships.forEach((partner) => {
    const partnershipCard = document.createElement("div");
    partnershipCard.classList.add("card-body", "partner");
    const partnerTitle = document.createElement("h5");
    partnerTitle.classList.add("card-title", "list-partners");
    partnerTitle.innerHTML = `${partner.country}`;
    partnershipCard.appendChild(partnerTitle);
    if (partner.agreements) {
      // Sort agreements by date, newest to oldest
      const sortedAgreements = [...partner.agreements].sort((a, b) => {
        if (!a.year || !b.year) return 0;
        return new Date(b.year) - new Date(a.year);
      });
      sortedAgreements.forEach((agreement, index) => {
        renderAgreementDetails(agreement, partnershipCard, index > 0);
      });
    } else if (partner.typeAgreement) {
      renderAgreementDetails(partner, partnershipCard);
    }
    scrollContainer.appendChild(partnershipCard);
  });
}

export function populateMultilateral(selectedBloc, multiJsonData) {
  const blocName = selectedBloc.replace(/\s+/g, " ");
  const bloc = multiJsonData.find((item) => item.blocName === blocName);
  if (!bloc) {
    console.error(`populateMultilateral: no data for coalition "${blocName}"`);
    return;
  }
  const card = document.querySelector(".card.partnership");
  card.innerHTML = "";

  // Pinned title; its look comes from .card-title.partner-select in style.css
  const title = document.createElement("h2");
  title.classList.add("card-title", "partner-select");
  title.textContent = blocName;
  card.appendChild(title);

  // Scrollable body: description and a link to the source
  const body = document.createElement("div");
  body.classList.add("custom-scroll");
  body.style.maxHeight = "100%";
  body.style.overflowY = "auto";
  body.style.paddingRight = "var(--space-lg)";

  const description = document.createElement("p");
  description.classList.add("card-text", "mt-2");
  description.style.fontSize = "var(--text-md)";
  description.innerHTML = bloc.description; // trusted: comes from our own multiPartner.json
  body.appendChild(description);

  const source = document.createElement("a");
  source.classList.add("card-link");
  source.href = bloc.link;
  source.target = "_blank";
  source.style.fontSize = "var(--text-md)";
  source.textContent = "View agreement";
  body.appendChild(source);

  card.appendChild(body);
}
export function clearCardContent() {
  const infoMultiContainer = document.querySelector(".card.partnership");

  if (infoMultiContainer) infoMultiContainer.innerHTML = "";
}
export function highlightBloc(svg, filteredGeoJSON, africanCountries) {
  const C = getMapColors();
  svg.selectAll("path").interrupt("highlight").transition("highlight").duration(DUR.fast).attr("fill", C.mapDefault).attr("stroke", C.mapStroke).attr("stroke-width", 0.5);

  const blocMembers = new Set(filteredGeoJSON.features.map((f) => f.properties.name));
  const nonAfricanMembers = new Set([...blocMembers].filter((name) => !africanCountries.has(name)));
  const africanMembers = new Set([...blocMembers].filter((name) => africanCountries.has(name)));

  svg
    .selectAll("path")
    .filter((d) => nonAfricanMembers.has(d.properties?.name))
    .interrupt("highlight")
    .transition("highlight")
    .duration(DUR.med)
    .attr("fill", C.blocNonAfrican); // darker teal: non-African members, mirrors EU's darker amber

  svg
    .selectAll("path")
    .filter((d) => africanMembers.has(d.properties?.name))
    .interrupt("highlight")
    .transition("highlight")
    .duration(DUR.med)
    .attr("fill", C.blocAfrican); // lighter teal: African members, mirrors partner countries' lighter amber
}
