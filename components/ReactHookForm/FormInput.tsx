// import { emailRegex, excludedEmailDomain, mobileRegex } from "@/utils/regex";
// import formatPhoneInput from "@/utils/formatPhoneInput";

import get from "just-safe-get";
import { GetErrorMessage } from "@/utils/GetErrorMessage";
import { useState } from "react";
import EyeSlashIcon from "@/components/svg/EyeSlashIcon";
import EyeIcon from "@/components/svg/EyeIcon";
import LoadingSpinIcon from "@/components/svg/LoadingSpinIcon";

function getRegisterProps(name: string) {
  if (name.toLowerCase().includes("year")) {
    return {
      // setValueAs: (v) => (v ? parseInt(v, 10) : null),
      // onChange: (e) => {
      //   console.log(`[] e.target.value :`, e.target.value);
      //   if (e.target.value < 1000) {
      //     return 1000;
      //   }
      //   return e.target.value;
      // },
    };
  }
  return {
    // email: {
    //   onChange: (e) => {
    //     e.target.value = e.target.value.trim();
    //   },
    //   pattern: {
    //     value: emailRegex,
    //     message: "Veuillez entrer un email valide",
    //   },
    //   validate: (v) =>
    //     excludedEmailDomain.test(v) ||
    //     "Impossible d'utiliser un email éphémère",
    // },
    // mobile: {
    //   onChange: (e) => {
    //     e.target.value = formatPhoneInput(e.target.value);
    //   },
    //   pattern: {
    //     value: mobileRegex,
    //     message: "Numéro de mobile invalide",
    //   },
    // },
    // password: {
    //   onChange: (e) => {
    //     e.target.value = e.target.value.trim();
    //   },
    //   minLength: {
    //     value: 6,
    //     message: "Minimum 6 caractères",
    //   },
    //   maxLength: {
    //     value: 60,
    //     message: "Maximum 60 caractères",
    //   },
    // },
  }[name];
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
  register: any;
  name: string;
  label?: string;
  isRequired?: boolean;
  errors: any;
  defaultValue?: any;
  disabled?: boolean;
  type?: string;
  registerProps?: any;
  controlClassName?: string;
  inputClassName?: string;
  // watch: any;
  // showPassword?: boolean;
  // toggleShowPassword?: () => void;
  onBlur?: () => void;
  onInputChange?: () => void;
  isLoading?: boolean;
};

export function FormInput({
  register,
  name,
  label = "",
  isRequired = false,
  errors,
  defaultValue,
  disabled = false,
  type: typeProp,
  registerProps = {},
  controlClassName = "",
  inputClassName = "", // showPassword = false,
  onBlur = () => {},
  onInputChange = () => {},
  isLoading = false,
  // watch,
  // showPassword = false,
  // toggleShowPassword = () => {},
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Create a version of name with every array index as [index]. replaced by .index.
  // This is to be able to use getValues() with arrays.
  const nameWithDotIndex = name.replace(/\[(\d+)\]\./g, ".$1.");

  // console.log(
  //   `[] get(errors, ${nameWithDotIndex}) :`,
  //   get(errors, nameWithDotIndex),
  // );
  const error = get(errors, nameWithDotIndex);
  const isInvalid = !!error;
  const type =
    (typeProp === "password" && showPassword ? "text" : null) ||
    typeProp ||
    (name.toLowerCase().includes("year") ? "number" : "text");
  const isNumber = type === "number";
  const errorMessage = error?.message;
  // console.log(`[] error :`, error);

  return (
    <div
      className={`relative form-control w-full max-w-xs ${controlClassName}${disabled ? ` opacity-50` : ""}`}
    >
      {(label || getLabel(name)) && (
        <label className="label">
          <span className="label-text">
            {label || getLabel(name)}
            {isRequired ? <span className="text-red-500 ml-1">*</span> : null}
          </span>
        </label>
      )}
      <div className="flex w-full relative" onBlur={onBlur}>
        <input
          className={`input input-bordered ${inputClassName} flex-1`}
          // type={["password"].includes(name) && showPassword ? "text" : "password"}
          type={type}
          {...register(name, {
            // ...(isRequired ? { required: "Info obligatoire" } : {}),
            ...(getRegisterProps(name) || {}),
            ...(isNumber ? { valueAsNumber: true } : {}),
            ...registerProps,
            // onChange: (e) => {},
          })}
          {...(isNumber ? { onWheel: numberInputOnWheelPreventChange } : {})}
          onChange={onInputChange}
          {...(defaultValue ? { defaultValue } : {})}
          {...(disabled ? { disabled: true } : {})}
        />
        {isLoading ? (
          <div className="absolute right-0 top-1/4">
            <LoadingSpinIcon />
          </div>
        ) : null}
        {typeProp === "password" && (
          <button
            className="btn btn-ghost ml-2 absolute right-0"
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
        <span className="label-text-alt text-red-500 absolute top-full">
          {GetErrorMessage(errorMessage)}
        </span>
      )}
    </div>
  );
}

export function FormTextarea({
  register,
  name,
  label = "",
  isRequired = false,
  errors,
  // watch,
  noValidation = false,
  isDisabled = false,
  value = undefined,
}) {
  return (
    <div className="form-control w-full max-w-xs">
      <label className="label">
        <span className="label-text">{label || getLabel(name)}</span>
      </label>
      <textarea
        className="textarea h-24 textarea-bordered"
        {...register(name, {
          ...(isRequired ? { required: "Info obligatoire" } : {}),
          ...((!noValidation && getRegisterProps(name)) || {}),
        })}
      />
      <span className="label-text-alt text-red-500">
        {errors[name] && errors[name].message}
      </span>
    </div>
  );
}

const numberInputOnWheelPreventChange = (e) => {
  // Prevent the input value change
  e.target.blur();

  // Prevent the page/container scrolling
  e.stopPropagation();

  // Refocus immediately, on the next tick (after the current function is done)
  setTimeout(() => {
    e.target.focus();
  }, 0);
};
