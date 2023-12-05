// import { emailRegex, excludedEmailDomain, mobileRegex } from "@/utils/regex";
// import formatPhoneInput from "@/utils/formatPhoneInput";

import get from "just-safe-get";
import { GetErrorMessage } from "@/utils/GetErrorMessage";

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
} // toggleShowPassword = () => {},
: FormInputProps) {
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
    typeProp || ["birthYear", "deathYear", "yearOfComposition"].includes(name)
      ? "number"
      : "text";
  const isNumber = type === "number";
  const errorMessage = error?.message;
  // console.log(`[] error :`, error);

  return (
    <div className={`form-control w-full max-w-xs ${controlClassName}`}>
      {(label || getLabel(name)) && (
        <label className="label">
          <span className="label-text">
            {label || getLabel(name)}
            {isRequired ? <span className="text-red-500 ml-1">*</span> : null}
          </span>
        </label>
      )}
      <input
        className={`input input-bordered ${inputClassName}`}
        // type={["password"].includes(name) && showPassword ? "text" : "password"}
        type={type}
        {...register(name, {
          // ...(isRequired ? { required: "Info obligatoire" } : {}),
          ...(getRegisterProps(name) || {}),
          ...(isNumber ? { valueAsNumber: true } : {}),
          ...registerProps,
        })}
        {...(defaultValue ? { defaultValue } : {})}
        {...(disabled ? { disabled: true } : {})}
      />
      {GetErrorMessage(errorMessage) && (
        <span className="label-text-alt text-red-500">
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
