export function addLegend(svg, colorScale) {
  //d3.select(".legend").remove();
  const legendContainer = d3.select(".third-col .card.partnership");
  legendContainer
    .append("h4")
    .attr("class", "legend-title")
    .style("text-align", "left")
    .style("margin", "10px 0")
    .style("font-weight", "bold")
    .style("font-size",  window.innerWidth <= 768 ?  "10pt" : "12pt")
	.style("margin-bottom",  window.innerWidth <= 768 ? "12px" :"")
	.style("padding-bottom",  window.innerWidth <= 768 ? "2.5px" :"")

	.style("border-bottom",  window.innerWidth <= 768 ? "1px solid black" :"")
	.style("width",  window.innerWidth <= 768 ? "155px" :"")


    .text("Number of Partnerships");



  const legend = legendContainer
    .append("div")
    .attr("class", "legend-vertical")
    .style("display", "flex")
    .style("flex-direction", window.innerWidth <= 768 ?  "rows" :  "column")
	.style("justify-content", window.innerWidth <= 768 ? "space-between" : "flex-start") // Condicional para distribución
	.style("text-align", window.innerWidth <= 768 ? "center" : "left") // Condicional para distribución
	.style("align-items", window.innerWidth <= 768 ? "center" : "left") 
	.style("gap", window.innerWidth <= 768 ? "10px" : "px") 

    .style("align-items", "left");

  colorScale.range().forEach((d, i) => {
    if (i > 0) {
      //console.log("D in color loop", d);
      //console.log("I in color loop", i);
      //console.log("D in color scale", colorScale.range());
      const legendItem = legend
        .append("div")
        .attr("class", "legend-item")
        .style("display", window.innerWidth <= 768 ? "block" : "flex")
		.style("margin", "0 auto")

        .style("align-items", "center")
        .style("margin", "5px 0");

      legendItem
        .append("div")
        .style("width",  window.innerWidth <= 768 ? "40px":"20px")
        .style("height",  window.innerWidth <= 768 ? "40px":"20px")
        .style("background-color", colorScale.range()[i])
		.style("margin-right", window.innerWidth <= 768 ? "0px" : "10px") 
      //legendItem.shift();

      legendItem
        .append("span")
        .text(numberToWord(i))
        .style("font-size", window.innerWidth <= 768 ? "11px" : "14px")
        .style("font-family", "Roboto");
    }
  });
}
// Mapeo de números a palabras
const numberToWord = (num) => {
  const words = {
    0: "0",
    1: "1",
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6 +",
    // Agrega más números si es necesario
  };
  return words[num] || num; // Devuelve el número si no está en el mapeo
};

export function showLegend() {
  d3.select(".legend").style("display", "block");
}

export function hideLegend() {
  d3.select(".legend").style("display", "none");
}
