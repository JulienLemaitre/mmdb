import isProd from "@/utils/envVariable/isProd";

type LogLevel = "log" | "warn" | "error" | "info" | "trace";
type ConsoleMethod =
  | "log"
  | "warn"
  | "error"
  | "info"
  | "trace"
  | "table"
  | "group"
  | "groupCollapsed"
  | "groupEnd"
  | "time"
  | "timeEnd"
  | "count"
  | "countReset"
  | "clear"
  | "dir"
  | "dirxml"
  | "assert";

type DebugLogger = {
  [K in ConsoleMethod]: Console[K];
};

const methodNames = [
  "log",
  "warn",
  "error",
  "info",
  "trace",
  "table",
  "group",
  "groupCollapsed",
  "groupEnd",
  "time",
  "timeEnd",
  "count",
  "countReset",
  "clear",
  "dir",
  "dirxml",
  "assert",
];

// No-op function for production
const noop = (..._args: never[]): void => {};

// Create debug logger that mirrors console API but is disabled in production
const createDebugLogger = (showInProd: boolean = false): DebugLogger => {
  if (isProd && !showInProd) {
    // Return no-op functions for production using the ConsoleMethod type
    return Object.fromEntries(
      (methodNames as ConsoleMethod[]).map((method) => [method, noop]),
    ) as DebugLogger;
  }

  // Return actual console methods for development/staging
  return Object.fromEntries(
    (methodNames as ConsoleMethod[])
      // eslint-disable-next-line no-console
      .map((method) => [method, console[method].bind(console)]),
  ) as DebugLogger;
};

// Export the debug logger instance
export const debug = createDebugLogger();
export const prodLog = createDebugLogger(true);

// Helper function to check if a method is a log level method
export const isLogLevel = (method: ConsoleMethod): method is LogLevel => {
  return (
    ["log", "warn", "error", "info", "debug", "trace"] as LogLevel[]
  ).includes(method as LogLevel);
};
