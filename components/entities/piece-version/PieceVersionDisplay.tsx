import { PieceVersionState } from "@/types/formTypes";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import getKeyLabel from "@/utils/getKeyLabel";
import CommonTimeIcon from "@/components/svg/CommonTimeIcon";
import CutTimeIcon from "@/components/svg/CutTimeIcon";
import React from "react";

type PieceVersionDisplayProps = {
  pieceVersion: PieceVersionState;
};

export default function PieceVersionDisplay({
  pieceVersion,
}: PieceVersionDisplayProps) {
  return (
    <>
      <div>Category : {formatToPhraseCase(pieceVersion.category)}</div>
      <div className="divide-y divide-gray-500 w-full text-sm">
        {pieceVersion.movements.map((movement, _, movementList) => (
          <div key={movement.id} className="flex my-2 pt-2 first:pt-0">
            <div>
              {movementList.length > 1 ? `Mvt ${movement.rank} - ` : ""}
              {getKeyLabel(movement.key)}
            </div>
            <div>
              {movement.sections.map((section) => {
                const { isCommonTime, isCutTime } = section;
                const isCommonOrCutTime = isCommonTime || isCutTime;
                return (
                  <div key={section.id} className="ml-4 flex">
                    <div>Section {section.rank}</div>
                    <div className="ml-1 flex content-center divide-x divide-gray-500">
                      <div className="px-2">
                        Metre :{" "}
                        {isCommonOrCutTime ? (
                          <>
                            <span className="common-time align-middle inline-block">
                              {isCommonTime ? (
                                <CommonTimeIcon className="h-3.5 relative bottom-0.5" />
                              ) : (
                                <CutTimeIcon className="h-5 relative bottom-0.5" />
                              )}
                            </span>
                            <b>{` (${section.metreNumerator}/${section.metreDenominator})`}</b>
                          </>
                        ) : (
                          <b>
                            {`${section.metreNumerator}/${section.metreDenominator}`}
                          </b>
                        )}
                      </div>
                      {section?.tempoIndication?.text && (
                        <div className="px-2">
                          {section.tempoIndication.text}
                        </div>
                      )}
                      {section.comment && (
                        <div className="italic px-2">
                          Comment : {section.comment}
                        </div>
                      )}
                      {section.commentForReview && (
                        <div className="italic px-2">
                          Comment for review : {section.commentForReview}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
