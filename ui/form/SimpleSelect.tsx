import Select from "@/ui/form/reactSelect/Select";
import labelOnlyFilterOption from "@/utils/labelOnlyFilterOption";
import { reactSelectStyles } from "@/ui/form/reactSelect/reactSelectStyles";
import { OptionInput } from "@/types/formTypes";

type SimpleSelectProps = {
  name: string;
  id: string;
  label: string;
  isRequired?: boolean;
  error?: string;
  value?: OptionInput;
  defaultValue?: OptionInput;
  options: OptionInput[];
  selectProps?: any;
  onChange: (option: OptionInput) => void;
};

const SimpleSelect = ({
  name,
  id,
  label,
  isRequired = false,
  error,
  value,
  defaultValue,
  options,
  selectProps = {},
  onChange,
}: SimpleSelectProps) => {
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
        onChange={onChange}
        value={
          value && typeof value?.value === "undefined" // avoid "changing an uncontrolled input to be controlled" error
            ? { value: "", label: "" }
            : value || defaultValue
        }
        filterOption={labelOnlyFilterOption}
        styles={reactSelectStyles}
        options={options}
        {...selectProps}
      />
      <div className="label-text-alt text-red-500 absolute top-full">
        {error}
      </div>
    </div>
  );
};

export default SimpleSelect;
