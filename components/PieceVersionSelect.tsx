"use client";
import {
  useEditForm,
  updateEditForm,
} from "@/components/context/editFormContext";
import { PieceVersionState } from "@/types/editFormTypes";

type PieceVersionSelectProps = {
  pieceVersions: PieceVersionState[];
};
export default function PieceVersionSelect({
  pieceVersions,
}: PieceVersionSelectProps) {
  const { dispatch } = useEditForm();
  const onSelect = (pieceVersionId: string) => {
    // const pieceVersion = pieceVersions.find(
    //   (pieceVersion) => pieceVersion.id === pieceVersionId,
    // );
    // Update the pieceVersionId in the context
    console.log(`[PieceVersionSelect] pieceVersionId: ${pieceVersionId}`);
    if (!pieceVersionId) return;
    updateEditForm(dispatch, "pieceVersionId", pieceVersionId);
  };

  return pieceVersions.map((pieceVersion) => (
    <div
      key={pieceVersion.id}
      className="flex p-4 rounded border-2 border-slate-300 hover:ring"
    >
      <input
        type="radio"
        id={pieceVersion.id}
        name="pieceVersion"
        value={pieceVersion.id}
        onChange={(e) => onSelect(e.target.value)}
        className="mr-4"
      />
      <label htmlFor={pieceVersion.id} className="flex-1">
        <div>category : {pieceVersion.category}</div>
        <div className="divide-y divide-gray-300 w-full">
          {pieceVersion.movements.map((movement, _, movementList) => (
            <div key={movement.id} className="flex my-2 pt-2">
              <div>
                {movementList.length > 1 ? `Mvt ${movement.rank} - ` : ""}
                {movement.key}
              </div>
              <div>
                {movement.sections.map((section) => {
                  const { isCommonTime, isCutTime } = section;
                  const isCommonOrCutTime = isCommonTime || isCutTime;
                  return (
                    <div key={section.id} className="ml-4 flex">
                      <div>Section {section.rank}</div>
                      <div className="ml-4">
                        <div>{section.tempoIndication.text}</div>
                        <div>
                          metre :{" "}
                          <b>
                            {isCommonOrCutTime ? (
                              <>
                                <span className="text-base/2 align-middle">
                                  {isCommonTime ? `\u{1D134}` : `\u{1D135}`}
                                </span>
                                {` (${section.metreNumerator}/${section.metreDenominator})`}
                              </>
                            ) : (
                              `${section.metreNumerator}/${section.metreDenominator}`
                            )}
                          </b>
                        </div>
                        <div>{section.comment?.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </label>
    </div>
  ));
}
