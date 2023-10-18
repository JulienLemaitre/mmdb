"use client";

import { useEditForm } from "@/components/context/editFormContext";

export default function Summary() {
  const { state } = useEditForm();

  return (
    <>
      <ul className="steps steps-vertical">
        <li className="step step-primary">Composer</li>
        <li className="step step-primary">Piece</li>
        <li className="step">MM Source</li>
        <li className="step">Metronome marks</li>
      </ul>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </>
  );
}
