import Select from "@/components/ReactSelect/Select";
import labelOnlyFilterOption from "@/utils/labelOnlyFilterOption";
import { useController } from "react-hook-form";
import { ReactSelectStyles } from "@/components/ReactSelect/ReactSelectStyles";

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
  options: {
    value: string;
    label: string;
  }[];
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
  const selectProps = { options, isRequired, isDisabled };
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
        filterOption={labelOnlyFilterOption}
        styles={ReactSelectStyles}
        {...selectProps}
      />
      <div className="label-text-alt text-red-500 absolute top-full">
        {fieldError?.message || fieldError?.value?.message}
      </div>
    </div>
  );
};

export default ControlledSelect;
