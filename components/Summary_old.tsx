"use client";

import {
  useEditForm,
  initEditForm,
} from "@/components/context/editFormContext";
import ResetIcon from "@/components/svg/ResetIcon";
import {
  URL_SELECT_COMPOSER,
  URL_SELECT_PIECE,
  URL_SELECT_PIECE_VERSION,
  URL_UPDATE_COMPOSER,
  URL_UPDATE_PIECE,
  URL_UPDATE_PIECE_VERSION,
  URL_UPDATE_SOURCE_DESCRIPTION,
} from "@/utils/routes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import NewBadge from "@/components/NewBadge";
import getKeyLabel from "@/utils/getKeyLabel";

export default function Summary_old() {
  const { dispatch, state, nextStep } = useEditForm();
  const router = useRouter();
  const [showRawContext, setShowRawContext] = useState<boolean>(false);

  const onReset = () => {
    console.log("Reset");
    initEditForm(dispatch);
    router.push(URL_SELECT_COMPOSER);
  };

  const composer = state.composer;
  const piece = state.piece;
  const pieceVersion = state.pieceVersion;
  const sourceDescription = state.sourceDescription;
  const sourceContributions = state.sourceContributions;
  const references = sourceDescription?.references ?? [];

  return (
    <div className="text-sm">
      <button className="btn btn-warning" onClick={onReset}>
        <ResetIcon className="w-5 h-5" />
        Reset all
      </button>
      {composer?.id ? (
        <div className="border-2 p-2 mt-3 hover:border-gray-300">
          <div className="float-right ml-2 mb-2">
            <button
              className="btn btn-outline btn-xs"
              onClick={() =>
                router.push(
                  composer.isNew
                    ? URL_UPDATE_COMPOSER + `?personId=${composer.id}`
                    : URL_SELECT_COMPOSER,
                )
              }
            >
              {composer.isNew ? "Update" : "Change selection"}
            </button>
          </div>
          <h3 className="font-bold uppercase text-xs">
            Composer
            {composer.isNew ? <NewBadge /> : null}
          </h3>
          <div>{`${composer.firstName} ${composer.lastName}`}</div>
          <div>{`${composer.birthYear} - ${composer.deathYear ?? ""}`}</div>
        </div>
      ) : null}
      {piece?.id ? (
        <div className="border-2 p-2 mt-3 hover:border-gray-300">
          <div className="float-right ml-2 mb-2">
            <button
              className="btn btn-outline btn-xs"
              onClick={() =>
                router.push(
                  piece.isNew
                    ? URL_UPDATE_PIECE + `?pieceId=${piece.id}`
                    : URL_SELECT_PIECE + `?composerId=${composer?.id}`,
                )
              }
            >
              {piece.isNew ? "Update" : "Change selection"}
            </button>
          </div>
          <h3 className="font-bold uppercase text-xs">
            piece{piece.isNew ? <NewBadge /> : null}
          </h3>
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
        <div className="border-2 p-2 mt-3 hover:border-gray-300">
          <div className="float-right ml-2 mb-2">
            <button
              className="btn btn-outline btn-xs"
              onClick={() =>
                router.push(
                  pieceVersion.isNew
                    ? URL_UPDATE_PIECE_VERSION +
                        `?pieceVersionId=${pieceVersion.id}`
                    : URL_SELECT_PIECE_VERSION + `?pieceId=${piece?.id}`,
                )
              }
            >
              {pieceVersion.isNew ? "Update" : "Change selection"}
            </button>
          </div>
          <h3 className="font-bold uppercase text-xs">
            Piece Version{pieceVersion.isNew ? <NewBadge /> : null}
          </h3>
          <div>{`Category: ${pieceVersion.category}`}</div>
          {pieceVersion.movements.map((movement, mvtIndex, mvtArray) => (
            <div key={`mvt-${movement.id}`}>
              <h3 className="mt-3">
                {mvtArray.length > 1 ? (
                  <span className="font-bold text-xs">{`Mvt ${movement.rank}`}</span>
                ) : null}
                {`${mvtArray.length > 1 ? ` in ` : ""}${getKeyLabel(movement.key)}`}
              </h3>
              {movement.sections.map((section, sectionIndex) => {
                const {
                  comment,
                  fastestOrnamentalNotesPerBar,
                  fastestRepeatedNotesPerBar,
                  fastestStaccatoNotesPerBar,
                  fastestStructuralNotesPerBar,
                  isCommonTime,
                  isCutTime,
                  metreDenominator,
                  metreNumerator,
                  rank,
                  tempoIndication,
                } = section;
                const isCommonOrCutTime = isCommonTime || isCutTime;
                return (
                  <div key={`mvt-${movement.id}-section-${section.id}`}>
                    <h4 className="italic mt-1">
                      <span className="not-italic font-bold text-xs">{`Section ${rank}`}</span>
                      {` - ${tempoIndication?.text}${
                        comment ? ` (${comment})` : ""
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
                            {` (${metreNumerator}/${metreDenominator})`}
                          </>
                        ) : (
                          `${metreNumerator}/${metreDenominator}`
                        )}
                      </b>
                    </div>
                    <h5 className="font-bold uppercase text-xs mt-1">
                      Fastest notes per bar
                    </h5>
                    {fastestStructuralNotesPerBar > 0 && (
                      <div className="">
                        structural : <b>{fastestStructuralNotesPerBar}</b>
                      </div>
                    )}
                    {fastestRepeatedNotesPerBar ? (
                      <div className="">
                        repeated : <b>{fastestRepeatedNotesPerBar}</b>
                      </div>
                    ) : null}
                    {fastestStaccatoNotesPerBar ? (
                      <div className="">
                        staccato: <b>{fastestStaccatoNotesPerBar}</b>
                      </div>
                    ) : null}
                    {fastestOrnamentalNotesPerBar ? (
                      <div className="">
                        ornamental : <b>{fastestOrnamentalNotesPerBar}</b>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
      {sourceDescription?.id ? (
        <div className="border-2 p-2 mt-3 hover:border-gray-300">
          {sourceDescription.isNew ? (
            <div className="float-right ml-2 mb-2">
              <button
                className="btn btn-outline btn-xs"
                onClick={() =>
                  router.push(
                    URL_UPDATE_SOURCE_DESCRIPTION +
                      `?sourceDescriptionId=${sourceDescription.id}`,
                  )
                }
              >
                {"Update"}
              </button>
            </div>
          ) : null}
          <h3 className="font-bold uppercase text-xs">
            Source{sourceDescription.isNew ? <NewBadge /> : null}
          </h3>
          {sourceDescription.title ? (
            <div>{sourceDescription.title}</div>
          ) : null}
          <div>{`${sourceDescription.year} [${sourceDescription.type}]`}</div>
          {sourceDescription.link ? <div>{sourceDescription.link}</div> : null}
          {references.map((reference) => (
            <div
              key={reference.reference}
            >{`${reference.type}: ${reference.reference}`}</div>
          ))}
          {(sourceContributions ?? []).length > 0 ? (
            <h4 className="font-bold uppercase text-xs mt-3">{`Contributors`}</h4>
          ) : null}
          {(sourceContributions ?? []).map((contribution) => (
            <div key={`contribution-${contribution.id}`}>
              <div>{`${contribution.role}: ${
                "person" in contribution
                  ? `${contribution.person.firstName} ${contribution.person.lastName}`
                  : `${contribution.organization.name}`
              }`}</div>
            </div>
          ))}
        </div>
      ) : null}
      {nextStep ? (
        <div className="my-4">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => router.push(nextStep.path)}
          >
            Next step: {nextStep.displayName}
          </button>
        </div>
      ) : null}
      <div className="mt-4">
        <button
          className="btn btn-outline btn-sm"
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
