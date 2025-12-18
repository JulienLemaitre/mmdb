"use client";

import { useState } from "react";
import ComposerPiecesDetails from "@/features/explore/ComposerPiecesDetails";

export default function ComposersPiecesDetails({ persons }) {
  const [selectedPerson, setSelectedPerson] = useState(persons[0]);

  return (
    <>
      {persons.map((person) => (
        <ComposerPiecesDetails key={person.id} person={person} />
      ))}
    </>
  );
}
