import Select from "@/components/ReactSelect/Select";
import labelOnlyFilterOption from "@/utils/labelOnlyFilterOption";
import { useController } from "react-hook-form";
import { ReactSelectStyles } from "@/components/ReactSelect/ReactSelectStyles";

const ControlledSelect = ({
  control,
  name,
  id,
  label,
  rules = {},
  isRequired = false,
  ...props
}) => {
  const { defaultValue, hasOptionsGrouped, optionKeys, ...selectProps } = props;
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { error },
  } = useController({
    name,
    control,
    rules,
  });

  return (
    <div
      className={`relative form-control mt-2 w-full max-w-xs${selectProps.isDisabled ? ` opacity-50 cursor-not-allowed` : ""}`}
    >
      {label && (
        <label className="label">
          <span className="label-text">
            {label}
            {isRequired ? <span className="text-red-500 ml-1">*</span> : null}
          </span>
        </label>
      )}
      <Select
        className="react-select-container"
        classNamePrefix="react-select"
        instanceId={`composer-select-${id}`}
        name={name}
        innerRef={ref}
        onChange={onChange}
        onBlur={onBlur}
        value={value || defaultValue}
        filterOption={labelOnlyFilterOption}
        styles={ReactSelectStyles}
        {...selectProps}
      />
      <div className="label-text-alt text-red-500">{error?.message}</div>
    </div>
  );
};

export default ControlledSelect;
