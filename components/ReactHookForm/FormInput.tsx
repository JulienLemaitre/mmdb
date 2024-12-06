import get from "just-safe-get";
import { GetErrorMessage } from "@/utils/GetErrorMessage";
import { useState } from "react";
import EyeSlashIcon from "@/components/svg/EyeSlashIcon";
import EyeIcon from "@/components/svg/EyeIcon";
import LoadingSpinIcon from "@/components/svg/LoadingSpinIcon";
import { InputMethod } from "@/types/formTypes";
import { Controller, ControllerRenderProps } from "react-hook-form";

function getRegisterProps({
  // name,
  inputMode,
}: {
  name: string;
  inputMode?: InputMethod;
}) {
  if (inputMode === "numeric") {
    return {
      pattern: /[0-9]{4}/,
      setValueAs: (v: string) => (v ? v.replace(/\D/g, "") : v),
    };
  }
}

const transformActions = {
  numeric: (rawValue: string) => rawValue.replace(/\D/g, ""),
  year: (rawValue: string) => rawValue.replace(/\D/g, "").substring(0, 4),
};

function getControllerProps(
  field: ControllerRenderProps,
  inputMode: InputMethod,
  onInputChange?: () => void,
) {
  const registerProps = getRegisterProps({ name: field.name, inputMode });
  let controllerProps: any = {
    rules: registerProps,
  };
  controllerProps.onChange = field.onChange;
  controllerProps.value = field.value || "";

  if (inputMode === "numeric") {
    controllerProps.onChange = (event: Event | undefined) => {
      // @ts-ignore
      const rawValue = event?.target?.value;
      const endValue = rawValue
        ? transformActions[
            field.name.toLowerCase().includes("year") ? "year" : "numeric"
          ](rawValue)
        : "";
      field.onChange(endValue);
    };

    if (typeof onInputChange === "function") {
      onInputChange();
    }
  }

  return controllerProps;
}

export function getLabel(name: string) {
  return {
    firstName: "First Name",
    lastName: "Last Name",
    birthYear: "Birth Year",
    deathYear: "Death Year",
    title: "Title",
    nickname: "Nickname",
    yearOfComposition: "Year of composition",
    category: "Category",
  }[name];
}

type FormInputProps = {
  control: any;
  controlClassName?: string;
  defaultValue?: any;
  disabled?: boolean;
  errors: any;
  inputClassName?: string;
  inputMode?: InputMethod;
  isLoading?: boolean;
  isRequired?: boolean;
  label?: string;
  name: string;
  onBlur?: () => void;
  onInputChange?: () => void;
  register: any;
  registerProps?: any;
  type?: string;
};

export function FormInput({
  control,
  controlClassName = "",
  defaultValue,
  disabled = false,
  errors,
  inputClassName = "", // showPassword = false,
  inputMode = "text",
  isLoading = false,
  isRequired = false,
  label = "",
  name,
  onBlur = () => {},
  onInputChange,
  type: typeProp,
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const nameWithDotIndex = name.replace(/\[(\d+)]\./g, ".$1.");
  const error = get(errors, nameWithDotIndex);
  const type =
    (typeProp === "password" && showPassword ? "text" : null) ||
    typeProp ||
    "text";
  const errorMessage = error?.message;

  return (
    <div
      className={`relative form-control w-full max-w-xs mt-2 ${controlClassName}${disabled ? ` opacity-50` : ""}`}
    >
      {(label || getLabel(name)) && (
        <label className="label">
          <span className="label-text">
            {label || getLabel(name)}
            {isRequired ? <span className="text-red-500 ml-1">*</span> : null}
          </span>
        </label>
      )}
      <div className="flex w-full relative align-middle" onBlur={onBlur}>
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <input
              className={`input input-sm input-bordered ${inputClassName} flex-1`}
              inputMode={inputMode}
              {...(getControllerProps(field, inputMode, onInputChange) || {})}
              onBlur={field.onBlur}
              ref={field.ref}
              name={field.name}
              type={type}
              {...(defaultValue ? { defaultValue } : {})}
              {...(disabled ? { disabled: true } : {})}
            />
          )}
        />
        {isLoading ? (
          <div className="absolute right-0 top-1/4">
            <LoadingSpinIcon />
          </div>
        ) : null}
        {typeProp === "password" && (
          <button
            className="btn btn-xs btn-ghost ml-2 absolute right-0 top-[4px]"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {GetErrorMessage(errorMessage) && (
        <div className="label-text-alt text-red-500 absolute top-[100%]">
          {GetErrorMessage(errorMessage)}
        </div>
      )}
    </div>
  );
}

// export function FormTextarea({
//   register,
//   name,
//   label = "",
//   isRequired = false,
//   errors,
//   noValidation = false,
// }) {
//   return (
//     <div className="form-control w-full max-w-xs">
//       <label className="label">
//         <span className="label-text">{label || getLabel(name)}</span>
//       </label>
//       <textarea
//         className="textarea h-24 textarea-bordered"
//         {...register(name, {
//           ...(isRequired ? { required: "Info obligatoire" } : {}),
//           ...((!noValidation && getRegisterProps({ name })) || {}),
//         })}
//       />
//       <span className="label-text-alt text-red-500">
//         {errors[name] && errors[name].message}
//       </span>
//     </div>
//   );
// }
