import { emailRegex, excludedEmailDomain, mobileRegex } from "@/utils/regex";
import formatPhoneInput from "@/utils/formatPhoneInput";
// import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";

function getRegisterProps(name: string) {
  return {
    // firstName: {
    //   minLength: {
    //     value: 2,
    //     message: "Minimum 2 caractères",
    //   },
    // },
    // lastName: {
    //   minLength: {
    //     value: 2,
    //     message: "Minimum 2 caractères",
    //   },
    // },
    birthYear: {
      setValueAs: (v) => (v ? parseInt(v) : null),
    },
    deathYear: {
      setValueAs: (v) => (v ? parseInt(v) : null),
    },
    // organization: {
    //   minLength: {
    //     value: 2,
    //     message: "Minimum 2 caractères",
    //   },
    // },
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
    // subject: {
    //   minLength: {
    //     value: 2,
    //     message: "Minimum 2 caractères",
    //   },
    // },
    // message: {
    //   minLength: {
    //     value: 20,
    //     message: "Minimum 20 caractères",
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

function getLabel(name: string) {
  return {
    firstName: "First Name",
    lastName: "Last Name",
    birthYear: "Birth Year",
    deathYear: "Death Year",
    organization: "Société",
    email: "Email",
    mobile: "Téléphone",
    subject: "Sujet",
    message: "Votre message",
    password: "Mot de passe",
  }[name];
}

export function FormInput({
  register,
  name,
  label = "",
  isRequired = false,
  errors,
  watch,
  showPassword = false,
  toggleShowPassword = () => {},
}) {
  const isInvalid = !!errors[name];

  // return (
  //   <input
  //     {...register("firstName", { required: "Info obligatoire", minLength: 3 })}
  //   />
  // );

  return (
    <div className="form-control w-full max-w-xs">
      <label className="label">
        <span className="label-text">{label || getLabel(name)}</span>
      </label>
      <input
        className="input input-bordered"
        // type={["password"].includes(name) && showPassword ? "text" : "password"}
        type={["birthYear", "deathYear"].includes(name) ? "number" : "text"}
        {...register(name, {
          // ...(isRequired ? { required: "Info obligatoire" } : {}),
          ...(getRegisterProps(name) || {}),
        })}
      />
      <span className="label-text-alt text-red-500">
        {errors[name] && errors[name].message}
      </span>
    </div>
  );

  /*    return (<FormControl
      variant="floating"
      isInvalid={!!errors[name]}
      isRequired={isRequired}
    >
      <FormLabel
        {...(watch(name) ? { className: "is-floating" } : {})}
        htmlFor={name}
      >
        {label || getLabel(name)}
      </FormLabel>

      {!["password"].includes(name) ? (
        <Input
          id={name}
          {...register(name, {
            ...(isRequired ? { required: "Info obligatoire" } : {}),
            ...(getRegisterProps(name) || {}),
          })}
        />
      ) : null}

      {["password"].includes(name) ? (
        <InputGroup>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            {...register(name, {
              ...(isRequired ? { required: "Info obligatoire" } : {}),
              ...(getRegisterProps(name) || {}),
            })}
          />
          <InputRightElement width="2.5rem">
            <IconButton
              aria-label="Afficher/cacher le mot de passe"
              size="lg"
              variant="unstyled"
              onClick={toggleShowPassword}
              icon={
                showPassword ? (
                  <ViewOffIcon color="black" />
                ) : (
                  <ViewIcon color="black" />
                )
              }
            />
          </InputRightElement>
        </InputGroup>
      ) : null}

      <FormErrorMessage variant="floating">
        {errors[name] && errors[name].message}
      </FormErrorMessage>
    </FormControl>
  );*/
}

export function FormTextarea({
  register,
  name,
  label = "",
  isRequired = false,
  errors,
  watch,
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

  // return (
  //   <FormControl
  //     variant="floating"
  //     isInvalid={!!errors[name]}
  //     isRequired={isRequired}
  //   >
  //     <FormLabel
  //       {...(watch(name) ? { className: "is-floating" } : {})}
  //       htmlFor={name}
  //     >
  //       {label || getLabel(name)}
  //     </FormLabel>
  //     <Textarea
  //       id={name}
  //       size="md"
  //       resize="vertical"
  //       isDisabled={isDisabled}
  //       value={value}
  //       {...register(name, {
  //         ...(isRequired ? { required: "Info obligatoire" } : {}),
  //         ...((!noValidation && getRegisterProps(name)) || {}),
  //       })}
  //     />
  //     <FormErrorMessage variant="floating">
  //       {errors[name] && errors[name].message}
  //     </FormErrorMessage>
  //   </FormControl>
  // );
}
