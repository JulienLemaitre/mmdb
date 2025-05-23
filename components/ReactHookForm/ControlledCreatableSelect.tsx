import CreatableSelect from "react-select/creatable";
import { useController } from "react-hook-form";
import { useState } from "react";
import { ReactSelectStyles } from "@/components/ReactSelect/ReactSelectStyles";

const ControlledCreatableSelect = ({
  control,
  name,
  id,
  label,
  rules = {},
  isRequired = false,
  onOptionCreated,
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
        value={value || defaultValue}
        styles={ReactSelectStyles}
        {...selectProps}
      />
      <div className="label-text-alt text-red-500">
        {error && error.message}
      </div>
    </div>
  );
};

export default ControlledCreatableSelect;
