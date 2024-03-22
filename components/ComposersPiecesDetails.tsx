"use client";

import { useState } from "react";
import ComposerPiecesDetais from "@/components/ComposerPiecesDetails";

export default function ComposersPiecesDetails({ persons }) {
  const [selectedPerson, setSelectedPerson] = useState(persons[0]);

  return (
    <>
      {persons.map((person) => (
        <ComposerPiecesDetais key={person.id} person={person} />
      ))}
    </>
  );
}
