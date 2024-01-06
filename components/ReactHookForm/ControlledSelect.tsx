import Select from "react-select";
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
        ref={ref}
        onChange={onChange}
        onBlur={onBlur}
        value={value || defaultValue}
        {...selectProps}
      />
      <span className="label-text-alt text-red-500">
        {error && error.message}
      </span>
    </div>
  );
};

export default ControlledSelect;
