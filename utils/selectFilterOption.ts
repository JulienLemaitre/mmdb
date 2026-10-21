import getPersonName from "@/utils/getPersonName";
import { normalizeForSearch } from "@/utils/normalizeForSearch";

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
    normalizeForSearch(option.label).startsWith(normalizeForSearch(inputValue))
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
  const normalizedInput = normalizeForSearch(inputValue);
  const isFirstNameSelected = option.data?.person?.firstName
    ? normalizeForSearch(option.data.person.firstName).startsWith(
        normalizedInput,
      )
    : false;
  const isLastNameSelected = option.data?.person?.lastName
    ? normalizeForSearch(option.data.person.lastName).startsWith(
        normalizedInput,
      )
    : false;
  const fullName = option.data?.person
    ? getPersonName(option.data?.person)
    : "";
  const isFullNameSelected =
    normalizeForSearch(fullName).startsWith(normalizedInput);

  return (
    isCreateOption ||
    isFirstNameSelected ||
    isLastNameSelected ||
    isFullNameSelected
  );
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
  const organizationName = option.data?.label
    ?.replaceAll(" [organization]", "")
    ?.trim();
  const normalizedName = organizationName
    ? normalizeForSearch(organizationName)
    : "";
  return (
    normalizedName.startsWith(normalizeForSearch(inputValue)) ||
    normalizedName
      .split(" ")
      .some((word) => word.startsWith(normalizeForSearch(inputValue)))
  );
}
