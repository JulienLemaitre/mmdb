import { clsx } from "clsx";

export default function Loader({ size = "md" }) {
  return (
    <span className={clsx("loading loading-spinner", `loading-${size}`)}></span>
  );
}
