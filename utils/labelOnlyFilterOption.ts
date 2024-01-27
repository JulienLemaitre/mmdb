import { createFilter } from "react-select";

const filterConfig = {
  stringify: (option) => option.label, // default is `${option.label} ${option.value}`,
};

export default createFilter(filterConfig);
