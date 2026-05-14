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

export function comparePersons(a: PersonState, b: PersonState): number {
  if (a.lastName < b.lastName) return -1;
  if (a.lastName > b.lastName) return 1;
  if (a.firstName < b.firstName) return -1;
  if (a.firstName > b.firstName) return 1;
  return 0;
}
