import { PieceVersionState } from "@/types/formTypes";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import getKeyLabel from "@/utils/getKeyLabel";

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
                    <div className="ml-1 flex divide-x divide-gray-500">
                      <div className="px-2">
                        metre :{" "}
                        {isCommonOrCutTime ? (
                          <>
                            <span className="text-4xl leading-3 align-middle">
                              {isCommonTime ? `\u{1D134}` : `\u{1D135}`}
                            </span>
                            {` (${section.metreNumerator}/${section.metreDenominator})`}
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
