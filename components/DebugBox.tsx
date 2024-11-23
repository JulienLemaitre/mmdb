import "react-json-view-lite/dist/index.css";
import { darkStyles, JsonView, allExpanded } from "react-json-view-lite";
import { useSearchParams } from "next/navigation";

type DebugBoxProps = {
  title?: string;
  stateObject: any;
  expandAllNodes?: boolean;
  shouldExpandNode?: (level: number, value: any, field?: string) => boolean;
};
export default function DebugBox({
  title,
  stateObject,
  expandAllNodes = true,
  shouldExpandNode,
}: DebugBoxProps) {
  const searchParams = useSearchParams();

  const debug = searchParams.get("debug");
  const isDebug = debug === "true";

  if (!isDebug) return null;

  return (
    <div className="text-[0.6em] my-3">
      {title ? <h2 className="font-bold">{title}</h2> : null}
      <JsonView
        data={stateObject}
        shouldExpandNode={
          typeof shouldExpandNode === "function"
            ? shouldExpandNode
            : expandAllNodes
              ? allExpanded
              : () => false
        }
        style={darkStyles}
        clickToExpandNode
      />
    </div>
  );
}
