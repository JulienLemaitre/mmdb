export const reactSelectStyles = {
  container: (baseStyles, state) => ({
    ...baseStyles,
    height: "2rem",
  }),
  control: (baseStyles, state) => ({
    ...baseStyles,
    height: "2rem !important",
    minHeight: "unset",
  }),
  input: (baseStyles, state) => ({
    ...baseStyles,
    fontSize: "0.875rem",
  }),
  option: (baseStyles, state) => ({
    ...baseStyles,
    fontSize: "0.875rem",
    padding: "4px 12px",
  }),
  valueContainer: (baseStyles, state) => ({
    ...baseStyles,
    padding: "0 8px",
  }),
  placeholder: (baseStyles, state) => ({
    ...baseStyles,
    fontSize: "0.875rem",
  }),
  indicatorsContainer: (baseStyles, state) => ({
    ...baseStyles,
    padding: 0,
    // padding: "4px",
  }),
  dropdownIndicator: (baseStyles, state) => ({
    ...baseStyles,
    // padding: 0,
    padding: "4px",
  }),
};
