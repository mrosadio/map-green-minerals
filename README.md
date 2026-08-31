# Partnerships with African Countries in Green Minerals

[Live demo](https://mrosadio.github.io/map-green-minerals/) · Part of a data visualization portfolio for the Africa Policy Research Institute

An interactive choropleth map exploring bilateral agreements between African
countries and international partners regarding access to critical minerals.

## Features
- Hover any African country for its partnership count and partner list
- Select a specific partner (country or the EU) from the **Partner** menu to
  see agreement details: signing date, access status, and areas of cooperation
- Responsive layout: desktop (side panel) and tablet portrait (stacked panel)

## Built with
- D3.js (geo projection, transitions)
- Vanilla JavaScript (ES modules)
- Bootstrap 5

## Data
Collected by APRI's Geopolitics and Geoeconomics Program from government
databases, treaty repositories, and secondary sources. Not exhaustive, see the in-app About modal for full methodology.

## Known limitations / next steps
- Multilateral (coalition-based) partnerships are not currently represented
  in this version — deliberately scoped out to keep the primary interaction
  model (map + single-partner lookup) clear for a first-time viewer. A
  second version exploring coalition-level data through a different
  interaction pattern is planned on a separate branch.
- A handful of small island nations (Comoros, Mauritius, São Tomé and
  Príncipe, Seychelles) are excluded from the map due to invalid geometry
  in the source GeoJSON.