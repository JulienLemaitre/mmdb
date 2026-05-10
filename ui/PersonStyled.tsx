import React from "react";
import { PersonState } from "@/types/formTypes";

export default function PersonStyled({ person }: { person: PersonState }) {
  return (
    <>
      {person.firstName} <strong>{person.lastName}</strong>
    </>
  );
}
