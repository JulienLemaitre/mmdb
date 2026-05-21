import Select from "@/ui/form/reactSelect/Select";
import { useController } from "react-hook-form";
import { reactSelectStyles } from "@/ui/form/reactSelect/reactSelectStyles";
import { JSX } from "react";

type ControlledSelectProps = {
  name: string;
  id: string;
  label?: string;
  rules?: any;
  isRequired?: boolean;
  defaultValue?: any;
  // hasOptionsGrouped?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  fieldError?: any;
  options: (
    | {
        value: string;
        label: string;
      }
    | {
        value: string;
        label: JSX.Element;
      }
  )[];
  filterOption?: (
    option: { label: string; value: string; data: any },
    inputValue: string,
  ) => boolean;
  formatOptionLabel?: (option: any) => JSX.Element | string;
  control: any;
  classNames?: string;
};

const ControlledSelect = ({
  control,
  name,
  id,
  label,
  rules = {},
  isRequired = false,
  isDisabled = false,
  fieldError,
  options,
  filterOption,
  formatOptionLabel,
  defaultValue,
  classNames,
}: ControlledSelectProps) => {
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { error },
  } = useController({
    name,
    control,
    rules,
  });
  const selectProps = {
    options,
    isRequired,
    isDisabled,
    formatOptionLabel,
    filterOption,
  };
  if (JSON.stringify(error) !== JSON.stringify(fieldError)) {
    console.warn(
      `[${name}] error and fieldError are different`,
      error,
      fieldError,
    );
  }

  return (
    <div
      className={`relative form-control w-full max-w-xs${selectProps.isDisabled ? ` opacity-50 cursor-not-allowed` : ""} ${classNames || "mt-2"}`}
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
        value={
          value && typeof value?.value === "undefined" // avoid "changing an uncontrolled input to be controlled" error
            ? null
            : value || defaultValue
        }
        styles={reactSelectStyles}
        {...selectProps}
      />
      <div
        className={`label-text-alt text-red-500 mt-${fieldError?.message ? "1" : "0"}`}
      >
        {fieldError?.message || fieldError?.value?.message}
      </div>
    </div>
  );
};

export default ControlledSelect;
