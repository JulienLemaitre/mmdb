import ReactSelect from "react-select";
import labelOnlyFilterOption from "@/utils/labelOnlyFilterOption";

function Select(props) {
  const { innerRef, ...otherProps } = props;
  return (
    <ReactSelect
      placeholder="Type here or select existing"
      {...otherProps}
      filterOption={labelOnlyFilterOption}
      ref={innerRef}
    />
  );
}

export default Select;
