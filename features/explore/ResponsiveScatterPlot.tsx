import ResponsiveWrapper from "@/features/explore/ResponsiveWrapper";
// import { ScatterPlot } from './ScatterPlot'
// import { ScatterPlotDatum, ScatterPlotSvgProps } from "./types";
import ScatterPlotChart from "@/features/explore/ScatterPlotChart";

type ScatterPlotDatum = {
  data: any[];
};

function ResponsiveScatterPlot(props: ScatterPlotDatum) {
  return (
    <ResponsiveWrapper>
      {({ width, height }) => (
        <ScatterPlotChart width={width} height={height} {...props} />
      )}
    </ResponsiveWrapper>
  );
}

export default ResponsiveScatterPlot;
