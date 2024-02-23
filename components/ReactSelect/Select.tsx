import ReactSelect from "react-select";
import labelOnlyFilterOption from "@/utils/labelOnlyFilterOption";

const Select = function Select(props) {
  const { innerRef, ...otherProps } = props;
  return (
    <ReactSelect
      {...otherProps}
      filterOption={labelOnlyFilterOption}
      ref={innerRef}
    />
  );
};

export default Select;
