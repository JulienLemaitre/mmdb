import React, { MutableRefObject, useMemo, useState } from "react";
import useD3 from "@/components/hooks/useD3";
import * as d3 from "d3";
import Tooltip from "@/ui/Tooltip";

type ScatterPlotChartProps = {
  data: any[];
  width: number;
  height: number;
  xAxisLegend?: string;
  yAxisLegend?: string;
  showLegend?: boolean;
};

const collideRadius = 3.5;
const symbolSize = 40;
const tooltipWidth = 230;
const nodeTransitionDuration = 300;
const axisColor = "#979797";

function ScatterPlotChart({
  data,
  width: propWidth,
  height: propHeight,
  xAxisLegend = "Date of composition",
  yAxisLegend = "Nb of notes per second",
  showLegend = true,
}: ScatterPlotChartProps) {
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipOpacity, setTooltipOpacity] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [minDate, maxDate, maxNotesPerSecond] = useMemo(
    () =>
      data.reduce(
        (minMaxArray, dataNode) => {
          const yearOfComposition = dataNode.meta?.piece?.yearOfComposition;
          let min = minMaxArray[0];
          let max = minMaxArray[1];
          if (typeof yearOfComposition === "number") {
            min = minMaxArray[0]
              ? Math.min(minMaxArray[0], yearOfComposition)
              : yearOfComposition;
            max = minMaxArray[1]
              ? Math.max(minMaxArray[1], yearOfComposition)
              : yearOfComposition;
          }
          const maxNotesPerSecond = Math.max(minMaxArray[2], dataNode.yVal);
          return [min, max, maxNotesPerSecond];
        },
        [null, null, null],
      ),
    [data],
  );

  // Specify the chart’s dimensions.
  const margin = { top: 20, right: 20, bottom: 25, left: 50 };
  const width = propWidth - margin.left - margin.right;
  const height = propHeight - margin.top - margin.bottom;

  const ref = useD3(
    (svg) => {
      // Declare the x (horizontal position) scale.
      const xScale = d3
        .scaleTime() // Change to scaleTime
        .domain([new Date(minDate - 2, 0, 1), new Date(maxDate + 2, 11, 31)]) // Use Date objects
        .range([margin.left, propWidth - margin.right]);

      // Declare the y (vertical position) scale.
      const yScale = d3
        .scaleLinear()
        .domain([0, maxNotesPerSecond])
        .range([height - margin.bottom, margin.top]);

      // Select or create the x-axis
      let xAxis = svg.select(".x-axis");
      if (xAxis.empty()) {
        xAxis = svg.append("g").attr("class", "x-axis");
      }

      // Update the x-axis
      xAxis
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

      // Select or create the y-axis
      let yAxis = svg.select(".y-axis");
      if (yAxis.empty()) {
        yAxis = svg.append("g").attr("class", "y-axis");
      }

      // Update the y-axis
      yAxis
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));

      // Get the actual ticks from the y-axis
      const yAxisTicks = yAxis
        .selectAll(".tick")
        .nodes()
        .map((node) => d3.select(node).datum());

      // Create horizontal grid lines
      let gridLines = svg.select(".grid-lines");
      if (gridLines.empty()) {
        gridLines = svg.append("g").attr("class", "grid-lines");
      }

      gridLines
        .selectAll(".grid-line")
        .data(yAxisTicks)
        .join(
          (enter) =>
            enter
              .append("line")
              .attr("class", "grid-line")
              .attr("x1", margin.left)
              .attr("x2", propWidth - margin.right)
              .attr("stroke", axisColor)
              .attr("stroke-dasharray", "4")
              .attr("y1", (d) => yScale(d))
              .attr("y2", (d) => yScale(d)),
          (update) =>
            update
              .attr("y1", (d) => yScale(d))
              .attr("y2", (d) => yScale(d))
              .attr("x2", propWidth - margin.right),
          (exit) => exit.remove(),
        );

      // Add X axis label
      let xAxisLabel = svg.select(".x-axis-label");
      if (xAxisLabel.empty()) {
        xAxisLabel = svg.append("text").attr("class", "x-axis-label");
      }
      xAxisLabel
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("fill", "currentColor")
        .attr("outline-width", "0px")
        .attr("outline-color", "transparent")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text(xAxisLegend);

      // Add Y axis label
      let yAxisLabel = svg.select(".y-axis-label");
      if (yAxisLabel.empty()) {
        yAxisLabel = svg.append("text").attr("class", "y-axis-label");
      }
      yAxisLabel
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("fill", "currentColor")
        .attr("outline-width", "0px")
        .attr("outline-color", "transparent")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left / 4)
        .attr("x", -height / 2)
        .text(yAxisLegend);

      // Add legend
      if (showLegend) {
        const legendData = [
          { noteType: "structural", color: "#00569c" },
          { noteType: "repeated", color: "#eb39ff" },
          { noteType: "ornamental", color: "#fdb925" },
          { noteType: "staccato", color: "#07a800" },
        ];

        let legend = svg.select(".node-type-legend");
        if (legend.empty()) {
          legend = svg.append("g").attr("class", "node-type-legend");
        }
        // Add a background rectangle for the legend
        let legendBackground = legend.select(".legend-background");
        if (legendBackground.empty()) {
          legendBackground = legend
            .append("rect")
            .attr("class", "legend-background");
        }
        legendBackground
          .attr("width", 100) // Adjust width as needed
          .attr("height", legendData.length * 18 + 10) // Height based on number of items
          .attr("fill", "rgba(125, 125, 125, 0.1)")
          .attr("rx", 5) // Rounded corners
          .attr("ry", 5);

        const legendItems = legend
          .selectAll(".legend-item")
          .data(legendData)
          .join("g")
          .attr("class", "legend-item")
          .attr("transform", (d, i) => `translate(0, ${i * 18 + 3})`);

        legendItems
          .selectAll("path")
          .data((d) => [d])
          .join("path")
          .attr("d", (d) => getShape(d.noteType))
          .attr("fill", (d) => d.color)
          .attr("transform", "translate(10, 10)");

        legendItems
          .selectAll("text")
          .data((d) => [d])
          .join("text")
          .attr("x", 25)
          .attr("y", 15)
          .attr("font-family", "sans-serif")
          .attr("font-size", "12px")
          .attr("fill", "currentColor")
          .attr("outline-width", "0px")
          .attr("outline-color", "transparent")
          .text((d) => d.noteType);

        legend.attr(
          "transform",
          `translate(${propWidth - 100}, ${margin.top})`,
        );
      }

      // Color scale: give me a specie name, I return a color
      const color = d3
        .scaleOrdinal()
        .domain(["structural", "repeated", "ornamental", "staccato"])
        .range(["#00569c", "#eb39ff", "#fdb925", "#07a800"]);

      // Initialize node positions
      data.forEach((d) => {
        d.x = xScale(new Date(d.xVal, 0, 1)); // Convert year to Date object
        d.y = yScale(d.yVal);
      });

      const node = svg
        .select(".plot-area")
        .selectAll("path")
        .data(data, (d) => `${d.meta.noteType}${d.meta.mm.id}`)
        .join(
          (enter) =>
            enter
              .append("path")
              .attr("d", (d) => getShape(d.noteType))
              .style("fill", (d) => color(d.noteType))
              .attr("class", "node")
              .attr("data-mmid", (d) => d.meta.mm.id)
              .call((enter) =>
                enter
                  .transition()
                  .duration(nodeTransitionDuration)
                  .attr("opacity", 1),
              )
              .on("mouseover", function (event, d) {
                //@ts-ignore
                d3.select(this)
                  .transition()
                  .duration(200)
                  .style("fill", "red")
                  .style("stroke", "black")
                  .style("stroke-width", 4);

                // Highlight connected points
                svg
                  .selectAll(".node")
                  .filter(
                    (p) =>
                      // Exclude the hovered node
                      `${p.meta.noteType}${p.meta.mm.id}` !==
                        `${d.meta.noteType}${d.meta.mm.id}` &&
                      // Same MMSource
                      p.meta.mm.mMSourceId === d.meta.mm.mMSourceId &&
                      // Same Piece
                      (p.meta.piece.id === d.meta.piece.id ||
                        // OR same collection if exists
                        (p.meta.piece.collectionId &&
                          d.meta.piece.collectionId &&
                          p.meta.piece.collectionId ===
                            d.meta.piece.collectionId)),
                  )
                  .transition()
                  .duration(200)
                  .style("fill", "red");
                setTooltipData(d);
                setTooltipOpacity(1);
                setTooltipPosition({ x: event.pageX, y: event.pageY });
              })
              .on("mouseout", function (event, d) {
                //@ts-ignore
                d3.select(this)
                  .transition()
                  .duration(200)
                  .attr("opacity", 1)
                  //@ts-ignore
                  .style("fill", (d) => color(d.noteType))
                  .style("stroke", "none");

                // Remove highlight from connected points
                svg
                  .selectAll(".node")
                  .filter(
                    (p) =>
                      // Exclude the overed node
                      `${p.meta.noteType}${p.meta.mm.id}` !==
                        `${d.meta.noteType}${d.meta.mm.id}` &&
                      // Same MMSource
                      p.meta.mm.mMSourceId === d.meta.mm.mMSourceId &&
                      // Same Piece
                      (p.meta.piece.id === d.meta.piece.id ||
                        // OR same collection if exists
                        (p.meta.piece.collectionId &&
                          d.meta.piece.collectionId &&
                          p.meta.piece.collectionId ===
                            d.meta.piece.collectionId)),
                  )
                  .transition()
                  .duration(200)
                  .attr("opacity", 1)
                  .style("fill", (d) => color(d.noteType))
                  .style("stroke", "none");

                setTooltipOpacity(0);
              }),
          (update) =>
            update
              .attr("d", (d) => getShape(d.noteType))
              .attr(
                "transform",
                (d) =>
                  `translate(${xScale(new Date(d.xVal, 0, 1))},${yScale(d.yVal)})`,
              )
              .style("fill", (d) => color(d.noteType)),
          (exit) =>
            exit.call((exit) =>
              exit
                .transition()
                .duration(nodeTransitionDuration)
                .attr("opacity", 0)
                .remove(),
            ),
        );

      function boundedForce(xScale, yScale) {
        return function (alpha) {
          for (let i = 0, n = data.length, node; i < n; ++i) {
            node = data[i];
            node.x =
              node.x + (xScale(new Date(node.xVal, 0, 1)) - node.x) * alpha;
            node.y = node.y + (yScale(node.yVal) - node.y) * alpha;
          }
        };
      }

      const simulation = d3
        .forceSimulation(data)
        .force(
          "x",
          d3
            .forceX()
            //@ts-ignore
            .x((d) => xScale(new Date(d.xVal, 0, 1))),
          // .strength(0.02),
        )
        .force(
          "y",
          d3
            .forceY()
            //@ts-ignore
            .y((d) => yScale(d.yVal as number)),
          // .strength(0.02),
        )
        .force("collision", d3.forceCollide().radius(collideRadius))
        .force("bounded", boundedForce(xScale, yScale))
        .alpha(0.1) // Reduce the overall force
        .alphaDecay(0.02) // Make the simulation run for less time
        .on("tick", function () {
          svg
            .selectAll(".node")
            .attr("transform", (d) => `translate(${d.x},${d.y})`);
        });

      // Return a cleanup function
      return () => {
        simulation.stop();
      };
    },
    [data, propWidth, propHeight],
  ) as unknown as MutableRefObject<SVGSVGElement>;

  return (
    <>
      <svg
        ref={ref}
        style={{
          height: propHeight,
          width: "100%",
          marginRight: "0px",
          marginLeft: "0px",
        }}
      >
        <g className="grid-lines" />
        <g className="plot-area" />
        <g className="x-axis" />
        <g className="y-axis" />
      </svg>
      <Tooltip
        node={{ data: tooltipData }}
        width={`${tooltipWidth}px`}
        left={
          tooltipPosition.x < (width + margin.left) / 2
            ? `${tooltipPosition.x + 10}px`
            : `${tooltipPosition.x - tooltipWidth - 70}px`
        }
        top={
          tooltipPosition.y < (height + margin.top) / 2
            ? `${tooltipPosition.y - 150}px`
            : undefined
        }
        bottom={
          tooltipPosition.y < (height + margin.top) / 2
            ? undefined
            : `${propHeight - tooltipPosition.y + 50}px`
        }
        opacity={tooltipOpacity}
      />
    </>
  );
}

function getShape(noteType: string) {
  switch (noteType) {
    case "structural":
      return d3.symbol().type(d3.symbolCircle).size(symbolSize)();
    case "repeated":
      return d3.symbol().type(d3.symbolDiamond).size(symbolSize)();
    case "ornamental":
      return d3.symbol().type(d3.symbolTriangle).size(symbolSize)();
    case "staccato":
      return d3.symbol().type(d3.symbolSquare).size(symbolSize)();
    default:
      return d3.symbol().type(d3.symbolCircle).size(symbolSize)();
  }
}

export default ScatterPlotChart;
