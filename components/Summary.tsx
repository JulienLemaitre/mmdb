"use client";

import {
  useEditForm,
  initEditForm,
} from "@/components/context/editFormContext";
import { SELECT_COMPOSER_URL, UPDATE_COMPOSER_URL } from "@/utils/routes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";

export default function Summary() {
  const { dispatch, state } = useEditForm();
  const router = useRouter();
  const [showRawContext, setShowRawContext] = useState<boolean>(false);

  const onReset = () => {
    console.log("Reset");
    initEditForm(dispatch);
    router.push(SELECT_COMPOSER_URL);
  };

  const composer = state.composer;
  const piece = state.piece;
  const pieceVersion = state.pieceVersion;
  const source = state.source;
  const contributions = state.contributions;
  // const metronomeMarks = state.metronomeMarks;

  return (
    <div className="text-sm">
      <button className="btn btn-warning" onClick={onReset}>
        Reset all
      </button>
      {composer?.id ? (
        <div
          className={clsx(
            "border-2 p-2 mt-3",
            composer.isNew ? "hover:border-primary" : "",
          )}
        >
          {composer.isNew ? (
            <div className="float-right ml-2 mb-2">
              <button
                className="btn btn-outline btn-xs"
                onClick={() =>
                  router.push(UPDATE_COMPOSER_URL + `?personId=${composer.id}`)
                }
              >
                Edit
              </button>
            </div>
          ) : null}
          <h3 className="font-bold uppercase text-xs">Composer</h3>
          <div>{`${composer.firstName} ${composer.lastName}`}</div>
          <div>{`${composer.birthYear} - ${composer.deathYear || ""}`}</div>
        </div>
      ) : null}
      {piece?.id ? (
        <div
          className={clsx(
            "border-2 p-2 mt-3",
            piece.isNew ? "hover:border-primary" : "",
          )}
        >
          <h3 className="font-bold uppercase text-xs mt-3">piece</h3>
          {piece.title ? (
            <>
              <div>{piece.title}</div>
              {piece.nickname ? (
                <div className="italic">{piece.nickname}</div>
              ) : null}
              {piece.yearOfComposition ? (
                <div>{piece.yearOfComposition}</div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
      {pieceVersion?.id ? (
        <div
          className={clsx(
            "border-2 p-2 mt-3",
            pieceVersion.isNew ? "hover:border-primary" : "",
          )}
        >
          <div>{`Category: ${pieceVersion.category}`}</div>
          {pieceVersion.movements.map((movement, mvtIndex, mvtArray) => (
            <div key={`mvt-${mvtIndex}`}>
              <h3 className="mt-3">
                {mvtArray.length > 1 ? (
                  <span className="font-bold text-xs">{`Mvt ${movement.rank}`}</span>
                ) : null}
                {`${mvtArray.length > 1 ? ` in ` : ""}${movement.key}`}
              </h3>
              {movement.sections.map((section, sectionIndex, sectionList) => {
                const {
                  isCommonTime,
                  isCutTime,
                  fastestStructuralNotesPerBar,
                  fastestStaccatoNotesPerBar,
                  fastestRepeatedNotesPerBar,
                  fastestOrnamentalNotesPerBar,
                } = section;
                const isCommonOrCutTime = isCommonTime || isCutTime;
                return (
                  <div key={`mvt-${mvtIndex}-section-${sectionIndex}`}>
                    <h4 className="italic mt-1">
                      <span className="not-italic font-bold text-xs">{`Section ${section.rank}`}</span>
                      {` - ${section.tempoIndication?.text}${
                        section.comment ? ` (${section.comment})` : ""
                      }`}
                    </h4>
                    <div>
                      metre :{" "}
                      <b>
                        {isCommonOrCutTime ? (
                          <>
                            <span className="common-time-sm align-middle">
                              {isCommonTime ? `\u{1D134}` : `\u{1D135}`}
                            </span>
                            {` (${section.metreNumerator}/${section.metreDenominator})`}
                          </>
                        ) : (
                          `${section.metreNumerator}/${section.metreDenominator}`
                        )}
                      </b>
                    </div>
                    <h5 className="font-bold uppercase text-xs mt-1">
                      Fastest notes per bar
                    </h5>
                    {section.fastestStructuralNotesPerBar && (
                      <div className="">
                        structural :{" "}
                        <b>{section.fastestStructuralNotesPerBar}</b>
                      </div>
                    )}
                    {section.fastestRepeatedNotesPerBar && (
                      <div className="">
                        repeated : <b>{section.fastestRepeatedNotesPerBar}</b>
                      </div>
                    )}
                    {section.fastestStaccatoNotesPerBar && (
                      <div className="">
                        staccato: <b>{section.fastestStaccatoNotesPerBar}</b>
                      </div>
                    )}
                    {section.fastestOrnamentalNotesPerBar && (
                      <div className="">
                        ornamental :{" "}
                        <b>{section.fastestOrnamentalNotesPerBar}</b>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
      {source?.id ? (
        <div
          className={clsx(
            "border-2 p-2 mt-3",
            source.isNew ? "hover:border-primary" : "",
          )}
        >
          <h3 className="font-bold uppercase text-xs mt-3">Source</h3>
          {source.title ? <div>{source.title}</div> : null}
          <div>{`${source.year} [${source.type}]`}</div>
          {source.link ? <div>{source.link}</div> : null}
          {source.references ? (
            <div>{JSON.stringify(source.references)}</div>
          ) : null}
          {(contributions || []).length > 0 ? (
            <h4 className="font-bold uppercase text-xs mt-3">{`Contributors`}</h4>
          ) : null}
          {(contributions || []).map((contribution, index) => (
            <div key={`contribution-${index}`}>
              <div>{`${contribution.role}: ${
                "person" in contribution
                  ? `${contribution.person.firstName} ${contribution.person.lastName}`
                  : `${contribution.organization.name}`
              }`}</div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-4">
        <button
          className="btn btn-neutral btn-sm"
          onClick={() => setShowRawContext((state) => !state)}
        >
          {`${showRawContext ? "Hide" : "Show"} raw context`}
        </button>
        {showRawContext ? (
          <pre className="text-xs mt-3 whitespace-pre-wrap">
            {JSON.stringify(state, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
