import CreatableSelect from "react-select/creatable";
import { useController } from "react-hook-form";
import { useState } from "react";

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
    <div className="form-control w-full max-w-xs">
      {label && (
        <label className="label">
          <span className="label-text">
            {label}
            {isRequired ? <span className="text-red-500 ml-1">*</span> : null}
          </span>
        </label>
      )}
      <CreatableSelect
        instanceId={`composer-select-${id}`}
        name={name}
        ref={ref}
        isDisabled={isLoading}
        isLoading={isLoading}
        onChange={onChange}
        onCreateOption={handleCreateOption}
        onBlur={onBlur}
        value={value || defaultValue}
        classNames={{
          control: () => "h-12",
        }}
        {...selectProps}
      />
      <span className="label-text-alt text-red-500">
        {error && error.message}
      </span>
    </div>
  );
};

export default ControlledCreatableSelect;
