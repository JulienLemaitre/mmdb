import React from "react";
import { PersonState } from "@/types/formTypes";
import getPersonName from "@/utils/getPersonName";

export function getPersonOption(composer: PersonState) {
  return {
    value: composer.id,
    label: getPersonName(composer),
    person: composer,
  };
}

export function formatPersonOption(option) {
  return (
    <div>
      {option.person.firstName} <strong>{option.person.lastName}</strong>
    </div>
  );
}
