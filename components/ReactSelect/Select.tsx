import ReactSelect from "react-select";
import labelOnlyFilterOption from "@/utils/labelOnlyFilterOption";

export default function Select(props) {
  return <ReactSelect {...props} filterOption={labelOnlyFilterOption} />;
}
