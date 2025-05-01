import React from "react";
import { useFeedForm } from "@/components/context/feedFormContext";
type PieceSummaryProps = {
  pieceId?: string;
};

function PieceSummary({ pieceId }: PieceSummaryProps) {
  const {
    state: { pieces = [], persons = [] },
  } = useFeedForm();
  const piece = pieces.find((piece) => piece.id === pieceId);
  const composer = persons.find((person) => person.id === piece?.composerId);
  const composerName = composer?.firstName + " " + composer?.lastName;
  const collection: any = {};

  if (!piece) return <div>{`No piece selected`}</div>;
  return (
    <>
      {collection ? (
        <div className="my-8 border-solid border-l-8 border-l-primary pl-2">
          <h2 className="text-3xl font-bold primary">{collection?.title}</h2>
        </div>
      ) : null}

      <div className="border-solid border-l-4 border-l-emerald-500 pl-2">
        <div>{`${composerName}`}</div>
        <h3 className="text-2xl font-bold">{piece.title}</h3>
        <div className="flex mb-4">
          <div className="mr-4">
            Year of composition: {piece.yearOfComposition}
          </div>
        </div>
      </div>
    </>
  );
}

export default PieceSummary;
