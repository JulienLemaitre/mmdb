import "react-json-view-lite/dist/index.css";
import { darkStyles, JsonView, allExpanded } from "react-json-view-lite";

type DebugBoxProps = {
  stateObject: any;
  expandAllNodes?: boolean;
};
export default function DebugBox({
  stateObject,
  expandAllNodes,
}: DebugBoxProps) {
  return (
    <div className="text-[0.6em]">
      <JsonView
        data={stateObject}
        shouldExpandNode={expandAllNodes ? allExpanded : () => false}
        style={darkStyles}
        clickToExpandNode
      />
    </div>
  );
}
