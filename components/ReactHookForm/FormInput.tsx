// import { emailRegex, excludedEmailDomain, mobileRegex } from "@/utils/regex";
// import formatPhoneInput from "@/utils/formatPhoneInput";

import get from "just-safe-get";
import { GetErrorMessage } from "@/utils/GetErrorMessage";
import { useState } from "react";
import EyeSlashIcon from "@/components/svg/EyeSlashIcon";
import EyeIcon from "@/components/svg/EyeIcon";

function getRegisterProps(name: string) {
  if (name.toLowerCase().includes("year")) {
    return {
      setValueAs: (v) => (v ? parseInt(v) : null),
    };
  }
  return {
    birthYear: {
      setValueAs: (v) => (v ? parseInt(v) : null),
    },
    deathYear: {
      setValueAs: (v) => (v ? parseInt(v) : null),
    },
    yearOfComposition: {
      setValueAs: (v) => (v ? parseInt(v) : null),
    },
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
            onChange: (e) => {},
          })}
          onChange={onInputChange}
          {...(defaultValue ? { defaultValue } : {})}
          {...(disabled ? { disabled: true } : {})}
        />
        {isLoading ? (
          <div className="absolute right-0 top-1/4">
            <svg
              aria-hidden="true"
              role="status"
              className="inline w-4 h-4 me-3 text-gray-200 animate-spin dark:text-gray-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="#1C64F2"
              />
            </svg>
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
