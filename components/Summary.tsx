"use client";

import {
  useEditForm,
  initEditForm,
} from "@/components/context/editFormContext";
import { EDITION_COMPOSER_URL } from "@/utils/routes";
import { useRouter } from "next/navigation";

export default function Summary() {
  const { dispatch, state } = useEditForm();
  const router = useRouter();

  const onReset = () => {
    console.log("Reset");
    initEditForm(dispatch);
    router.push(EDITION_COMPOSER_URL);
  };

  return (
    <>
      <button className="btn btn-ghost" onClick={onReset}>
        Reset
      </button>
      {/*<ul className="steps steps-vertical">
        <li className="step step-primary">Composer</li>
        <li className="step step-primary">Piece</li>
        <li className="step">MM Source</li>
        <li className="step">Metronome marks</li>
      </ul>*/}
      <pre className="text-xs whitespace-pre-wrap">
        {JSON.stringify(state, null, 2)}
      </pre>
    </>
  );
}
