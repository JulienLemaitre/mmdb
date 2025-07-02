import { ChangeEvent } from "react";
import { GetErrorMessage } from "@/utils/GetErrorMessage";
import { useState } from "react";
import EyeSlashIcon from "@/components/svg/EyeSlashIcon";
import EyeIcon from "@/components/svg/EyeIcon";
import LoadingSpinIcon from "@/components/svg/LoadingSpinIcon";
import { InputMethod } from "@/types/formTypes";

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

type SimpleInputProps = {
  controlClassName?: string;
  defaultValue?: any;
  disabled?: boolean;
  error?: string;
  inputClassName?: string;
  inputMode?: InputMethod;
  isLoading?: boolean;
  isRequired?: boolean;
  label?: string;
  name: string;
  onBlur?: () => void;
  onInputChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
};

export function SimpleInput({
  controlClassName,
  defaultValue,
  disabled = false,
  error,
  inputClassName = "", // showPassword = false,
  inputMode = "text",
  isLoading = false,
  isRequired = false,
  label = "",
  name,
  onBlur = () => {},
  onInputChange,
  type: typeProp,
}: SimpleInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const type =
    (typeProp === "password" && showPassword ? "text" : null) ||
    typeProp ||
    "text";
  const errorMessage = error || "";

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
      <div className="flex w-full relative align-middle">
        <input
          className={`input input-sm input-bordered ${inputClassName} flex-1`}
          inputMode={inputMode}
          {...(defaultValue ? { defaultValue } : {})}
          onBlur={onBlur}
          name={name}
          type={type}
          onChange={onInputChange}
          {...(disabled ? { disabled: true } : {})}
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
        <div className="label-text-alt text-red-500 absolute top-full">
          {GetErrorMessage(errorMessage)}
        </div>
      )}
    </div>
  );
}
