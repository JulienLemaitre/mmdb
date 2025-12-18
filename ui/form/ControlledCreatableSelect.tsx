import CreatableSelect from "react-select/creatable";
import { useController } from "react-hook-form";
import { useState } from "react";
import { reactSelectStyles } from "@/ui/form/reactSelect/reactSelectStyles";

const ControlledCreatableSelect = ({
  control,
  name,
  id,
  label,
  rules = {},
  isRequired = false,
  onOptionCreated,
  fieldError,
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
  if (JSON.stringify(error) !== JSON.stringify(fieldError)) {
    console.warn(
      `[${name}] error and fieldError are different`,
      error,
      fieldError,
    );
  }
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateOption = async (inputValue: string) => {
    setIsLoading(true);
    if (typeof onOptionCreated === "function") {
      const newOption = await onOptionCreated(inputValue);
      console.log(`[ControlledCreatableSelect] newOption :`, newOption);
      onChange(newOption);
    }
    setIsLoading(false);
  };

  return (
    <div className="form-control w-full max-w-xs mt-2">
      {label && (
        <label className="label">
          <span className="label-text">
            {label}
            {isRequired ? <span className="text-red-500 ml-1">*</span> : null}
          </span>
        </label>
      )}
      <CreatableSelect
        className="react-select-container"
        classNamePrefix="react-select"
        instanceId={`composer-select-${id}`}
        name={name}
        ref={ref}
        placeholder="Type here or select existing"
        isDisabled={isLoading}
        isLoading={isLoading}
        onChange={onChange}
        onCreateOption={handleCreateOption}
        onBlur={onBlur}
        value={value || defaultValue || null}
        styles={reactSelectStyles}
        {...selectProps}
      />
      <div className="label-text-alt text-red-500">
        {fieldError?.message || fieldError?.value?.message}
      </div>
    </div>
  );
};

export default ControlledCreatableSelect;
