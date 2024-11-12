import React from "react";
import * as d3 from "d3";

function useD3(renderChartFn, dependencies) {
  const ref = React.useRef();

  React.useEffect(() => {
    // renderChartFn(d3.select(ref.current));
    // return () => {};
    const cleanup = renderChartFn(d3.select(ref.current));
    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, dependencies);
  return ref;
}

export default useD3;
