export function filterOptionByWordStart(
  option: {
    label: string;
    value: string;
    data: any;
  },
  inputValue: string,
): boolean {
  const isCreateOption = option.label.startsWith("Create");
  return (
    isCreateOption ||
    option.label.toLowerCase().startsWith(inputValue.toLowerCase())
  );
}

export function filterPersonOption(
  option: {
    label: string;
    value: string;
    data: any;
  },
  inputValue: string,
): boolean {
  const isCreateOption = option.label.startsWith("Create");
  const isFirstNameSelected = option.data?.person?.firstName
    ?.toLowerCase()
    .startsWith(inputValue.toLowerCase());
  const isLastNameSelected = option.data?.person?.lastName
    ?.toLowerCase()
    .startsWith(inputValue.toLowerCase());
  return isCreateOption || isFirstNameSelected || isLastNameSelected;
}

export function filterContributionOption(
  option: {
    label: string;
    value: string;
    data: any;
  },
  inputValue: string,
): boolean {
  const isCreateOption = option.label.startsWith("Create");
  if (isCreateOption) {
    return true;
  }
  // Person
  if (option.data?.person) {
    return filterPersonOption(option, inputValue);
  }
  // Organization - match any word start
  return option.data?.label
    ?.replaceAll(" [organization]", "")
    ?.toLowerCase()
    ?.split(" ")
    .some((word) => word.startsWith(inputValue.toLowerCase()));
}
