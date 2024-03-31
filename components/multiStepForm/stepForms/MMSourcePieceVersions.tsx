import React from "react";
import { updateFeedForm } from "@/components/context/feedFormContext";

const MMSourcePieceVersions = () => {
  return (
    <>
      <div className="w-full prose">
        <h1>Pieces and Versions</h1>
        <p>
          {`In this section you will describe, in order, the pieces that are part of your MM Source.`}
        </p>
        <h2>For a given piece</h2>
        <ol>
          <li>
            <p>
              {`You will first search for it in the data we already have. If you don't find it there, you will have to register it.`}
            </p>
          </li>
          <li>
            <p>
              {`Then, the piece already exist in the database, you will be presented with a list of versions that are already registered for it. If one correspond to your case, select it.`}
            </p>
            <p>
              {`If none of them correspond, or if the piece itself was not present in the database, you will describe the version you have in hand.`}
            </p>
          </li>
        </ol>
      </div>

      <div className="card w-full bg-base-200 text-base-content shadow-xl max-w-[65ch]">
        <div className="card-body">
          <h2 className="card-title">What is a Piece Version</h2>
          <div className="prose">
            <p>{`A Piece Version is the structure of a the piece in terms of movements (if any) and sections.`}</p>
            <p>{`A sections is defined by three characteristics: `}</p>
            <ul>
              <li>time signature</li>
              <li>tempo indication</li>
              <li>metronome mark</li>
            </ul>
            <p>{`Each time one of them changes, you need to define a new section.`}</p>
            <p>{`Once a section has been created, you will register the maximum number of notes per bar concerning structural, staccato, repeated and ornamental notes.`}</p>
          </div>
        </div>
      </div>
      {/*<button
        className="btn btn-primary"
        onClick={() =>
          updateFeedForm(dispatch, "formInfos", { introDone: true, next: true })
        }
      >
        Begin now!
      </button>*/}
    </>
  );
};

export default MMSourcePieceVersions;
