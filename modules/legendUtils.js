export function addLegend(svg, colorScale, title = "Number of partnerships", labels = ["1", "6+"]) {
  const titleEl = d3.select(".d-flex.flex-column.p-2.fs-7.legend-title");
  titleEl.text(title);
  // The swatches and range labels are visual only: give assistive technology one sentence instead
  d3.select("#legend").attr("role", "img").attr("aria-label", `Legend: ${title}, from ${labels[0]} to ${labels[1]}`);
  const barRow = d3.select(".d-flex.flex-row.g-0.legend-bar-row");
  const labelRow = d3.select(".d-flex.justify-content-between.legend-label-row");
  // clear before redrawing to avoid duplication on repeated calls
  barRow.html("");
  labelRow.html("");
  colorScale.range().forEach((color, i) => {
    if (i == 0) return;
      barRow
        .append("div")
        .style("flex", "1") // equal width per step
        .style("background-color", color)
        .style("height", "12px");
  });
  labelRow.append("span").text(labels[0]).style("color", "var(--color-text-muted)");
  labelRow.append("span").text(labels[1]).style("color", "var(--color-text-muted)");
}