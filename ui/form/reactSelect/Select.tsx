import ReactSelect from "react-select";

function Select(props) {
  const { innerRef, ...otherProps } = props;
  return (
    <ReactSelect
      placeholder="Type here or select existing"
      {...otherProps}
      ref={innerRef}
    />
  );
}

export default Select;
