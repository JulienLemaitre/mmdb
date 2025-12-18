import SectionMeter from "@/features/section/ui/SectionMeter";
import { NotesPerSecondCollection } from "@/utils/notesCalculation";
import getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM from "@/utils/getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM";
import getNoteValueLabel from "@/utils/getNoteValueLabel";
import React from "react";

export function SectionDetail({ section }) {
  return (
    <div
      key={section.id}
      className="px-4 py-2 border-l-2 border-l-secondary/10 hover:border-l-secondary bg-secondary/5 transition-all duration-150"
    >
      <h6 className="text-sm font-semibold text-secondary">
        {`Section ${section.rank}\u2002-\u2002`}
        <SectionMeter section={section} />
        <span className="italic">
          {section?.tempoIndication?.text &&
            `\u2002-\u2002${section.tempoIndication.text}`}
        </span>
      </h6>
      {section.comment && (
        <div className="text-xs italic">Comment: {section.comment}</div>
      )}
      {section.commentForReview && (
        <div className="text-xs italic px-2 pt-1 bg-warning/10 rounded mt-2">
          Review note: {section.commentForReview}
        </div>
      )}

      <div className="text-xs space-y-3">
        {section.metronomeMarks &&
          section.metronomeMarks.map((mm: any, idx: number) => {
            if (mm.noMM) {
              return (
                <div key={idx}>
                  <div className="italic">No metronome mark indicated</div>
                  {mm.comment && (
                    <div className="text-xs italic">
                      {`Comment: ${mm.comment}`}
                    </div>
                  )}
                </div>
              );
            }

            // Compute notes per second using the utility function
            let notesPerSecondCollection: NotesPerSecondCollection | null =
              null;
            try {
              notesPerSecondCollection =
                getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM({
                  section,
                  metronomeMark: mm,
                });
            } catch (e) {
              console.error("Error computing notes per second:", e);
            }

            return (
              <div key={idx} className="space-y-2">
                {notesPerSecondCollection && (
                  <div>
                    <div className="font-medium mb-1">
                      Fastest notes for metronome mark:{" "}
                      {getNoteValueLabel(mm.beatUnit)} = {mm.bpm}
                    </div>
                    <div className="rounded">
                      {/* Table headers */}
                      <div className="grid grid-cols-3 text-xs font-medium border-b border-secondary/20">
                        <div className="p-2 border-r border-secondary/20">
                          Note type
                        </div>
                        <div className="p-2 border-r border-secondary/20">
                          Notes per bar
                        </div>
                        <div className="p-2">Notes per second (computed)</div>
                      </div>
                      {/* Table rows */}
                      {[
                        {
                          key: "fastestStructuralNotes",
                          label: "Structural",
                          notesPerBar: section.fastestStructuralNotesPerBar,
                          notesPerSecond:
                            notesPerSecondCollection.fastestStructuralNotesPerSecond,
                        },
                        {
                          key: "fastestRepeatedNotes",
                          label: "Repeated",
                          notesPerBar: section.fastestRepeatedNotesPerBar,
                          notesPerSecond:
                            notesPerSecondCollection.fastestRepeatedNotesPerSecond,
                        },
                        {
                          key: "fastestStaccatoNotes",
                          label: "Staccato",
                          notesPerBar: section.fastestStaccatoNotesPerBar,
                          notesPerSecond:
                            notesPerSecondCollection.fastestStaccatoNotesPerSecond,
                        },
                        {
                          key: "fastestOrnamentalNotes",
                          label: "Ornamental",
                          notesPerBar: section.fastestOrnamentalNotesPerBar,
                          notesPerSecond:
                            notesPerSecondCollection.fastestOrnamentalNotesPerSecond,
                        },
                      ]
                        .filter((item) => item.notesPerBar)
                        .map((item) => (
                          <div
                            key={item.key}
                            className="grid grid-cols-3 text-xs border-b border-secondary/10 last:border-b-0"
                          >
                            <div className="px-2 py-1 border-r border-secondary/20">
                              {item.label}
                            </div>
                            <div className="px-2 py-1 border-r border-secondary/20">
                              {item.notesPerBar}
                            </div>
                            <div className="px-2 py-1 flex items-center gap-2">
                              {item.notesPerSecond && (
                                <div
                                  className={`w-3 h-3 ${
                                    item.notesPerSecond >= 15
                                      ? "bg-red-500"
                                      : item.notesPerSecond >= 11
                                        ? "bg-orange-400"
                                        : item.notesPerSecond >= 8
                                          ? "bg-amber-200"
                                          : "bg-white border border-gray-300"
                                  }`}
                                />
                              )}
                              {item.notesPerSecond
                                ? Math.round(item.notesPerSecond * 100) / 100
                                : "-"}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {mm.comment && (
                  <div className="text-xs italic">
                    {`Comment: ${mm.comment}`}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
