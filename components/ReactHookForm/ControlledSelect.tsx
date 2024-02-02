import Select from "@/components/ReactSelect/Select";
import labelOnlyFilterOption from "@/utils/labelOnlyFilterOption";
import { useController } from "react-hook-form";

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
    <div className="form-control w-full max-w-xs">
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
        {...selectProps}
      />
      <span className="label-text-alt text-red-500">{error?.message}</span>
    </div>
  );
};

export default ControlledSelect;
