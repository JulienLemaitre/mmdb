import React from "react";
import { OptionOrganizationInput, OptionPersonInput } from "@/types/formTypes";

export function formatSourceContributionOption(
  option: OptionPersonInput | OptionOrganizationInput,
) {
  if ("person" in option)
    return (
      <div>
        {option.person.firstName} <strong>{option.person.lastName}</strong>{" "}
        [person]
      </div>
    );

  if ("organization" in option)
    return (
      <div>
        <strong>{option.organization.name}</strong> [organization]
      </div>
    );

  return null;
}
