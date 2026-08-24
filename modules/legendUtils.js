export function addLegend(svg, colorScale) {
  //d3.select(".legend").remove();
  const title = d3.select(".d-flex.flex-column.p-2.fs-7.legend-title");
  title.text("Number of Partnerships");
  const barRow = d3.select(".d-flex.flex-row.g-0.legend-bar-row");
  const labelRow = d3.select(".d-flex.justify-content-between.legend-label-row");
  console.log('Color scale range', colorScale)
  colorScale.range().forEach((color, i) => {
    if (i == 0) return;
      barRow
        .append("div")
        .style("flex", "1") // equal width per step
        .style("background-color", color)
        .style("height", "12px");
  });
  labelRow.append("span").text("1").style("font-size", "11px").style("color", "#5F5E5A");
  labelRow.append("span").text("6+").style("font-size", "11px").style("color", "#5F5E5A");
}
// export function showLegend() {
//   d3.select(".legend").style("display", "block");
// }

// export function hideLegend() {
//   d3.select(".legend").style("display", "none");
// }
