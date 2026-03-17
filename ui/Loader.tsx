import React from "react";
import { clsx } from "clsx";

interface LoaderProps {
  /**
   * Size of the loader.
   * Can be a preset string ("xs", "sm", "md", "lg", "xl") or a number representing the scale factor.
   * Default is "md" (approx 50px).
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  /**
   * Optional color override. Accepts any valid CSS color string.
   */
  color?: string;
  className?: string;
}

// Original dimensions of the Metronome component as defined in globals.css
const ORIGIN_WIDTH = 250;
const ORIGIN_HEIGHT = 262;

const SIZE_MAP: Record<string, number> = {
  xs: 0.1, // ~25px
  sm: 0.15, // ~39px
  md: 0.2, // ~50px
  lg: 0.3, // ~75px
  xl: 0.5, // ~125px
};

export default function Loader({
  size = "md",
  className,
  color,
}: Readonly<LoaderProps>) {
  const scale = typeof size === "number" ? size : (SIZE_MAP[size] ?? 0.2);
  const sizeKey = typeof size === "number" ? undefined : size;

  // We calculate the wrapper dimensions based on the scale to ensure the loader
  // takes up the correct amount of space in the layout.
  const width = ORIGIN_WIDTH * scale;
  const height = ORIGIN_HEIGHT * scale;

  return (
    <output
      className={clsx("relative inline-block", className)}
      style={{ width, height }}
      aria-label="Loading"
    >
      <div
        className={clsx(
          "metronome-container",
          sizeKey && `metronome-${sizeKey}`,
        )}
        style={{
          // Scale the original metronome down to the desired size
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          // Override the default margin: auto from globals.css to ensure correct positioning
          margin: 0,
          // Apply custom color if provided
          ...(color ? ({ "--color": color } as React.CSSProperties) : {}),
        }}
      >
        <div className="base">
          <div className="bar bar-bottom"></div>
          <div className="bar bar-right"></div>
          <div className="bar bar-left"></div>
          <div className="bar bar-top"></div>
          <div className="bar bar-middle"></div>
          <div className="wheel w-right"></div>
          <div className="wheel w-left"></div>
        </div>
        <div className="stick-container">
          <div className="stick">
            <div className="hole"></div>
            <div className="top"></div>
          </div>
        </div>
      </div>
    </output>
  );
}
