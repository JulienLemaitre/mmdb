import React, { useEffect, useState } from "react";
import {
  initFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { URL_API_FEEDFORM_SUBMIT } from "@/utils/routes";
import { fetchAPI } from "@/utils/fetchAPI";
import { useSession } from "next-auth/react";
import computeMMSourceToPersistFromState from "@/utils/computeMMSourceToPersistFromState";
import {
  COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
  FEED_FORM_LOCAL_STORAGE_KEY,
  SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";
import dynamic from "next/dynamic";
import getNoteValueLabel from "@/utils/getNoteValueLabel";
import getKeyLabel from "@/utils/getKeyLabel";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import getSourceTypeLabel from "@/utils/getSourceTypeLabel";
import getReferenceTypeLabel from "@/utils/getReferenceTypeLabel";
import SectionMeter from "@/components/entities/section/SectionMeter";
import getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM from "@/utils/getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM";
import { NotesPerSecondCollection } from "@/utils/notesCalculation";
import getIMSLPPermaLink from "@/utils/getIMSLPPermaLink";
import getRoleLabel from "@/utils/getRoleLabel";

const SAVE_INFO_MODAL_ID = "save-info-modal";
const InfoModal = dynamic(() => import("@/components/InfoModal"), {
  ssr: false,
});

function FeedSummary() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState<boolean>();
  const { dispatch, state } = useFeedForm();
  const { data: session } = useSession();

  const mMSourceToPersist = computeMMSourceToPersistFromState(state);

  const saveAll = () => {
    console.log(
      `[FeedSummary] saveAll mMSourceToPersist :`,
      JSON.stringify(mMSourceToPersist),
    );
    console.log(`[FeedSummary] saveAll state :`, JSON.stringify(state));
    setIsSubmitting(true);
    fetchAPI(
      URL_API_FEEDFORM_SUBMIT,
      {
        body: state,
      },
      session?.user?.accessToken,
    )
      .then(async (response) => {
        console.log("response", response);

        if (response.error) {
          console.error("Error submitting form:", JSON.stringify(response));
          setIsSaveSuccess(false);
          // Send log email
          await fetchAPI(
            "/api/sendEmail",
            {
              body: {
                type: "FeedForm ERROR",
                mMSourceToPersist,
                state,
                message: `Error submitting form`,
                errorStatus: response.status,
                error: response.error,
                response,
              },
            },
            session?.user?.accessToken,
          )
            .then((result) =>
              console.log(`[FeedSummary] result from sendEmail :`, result),
            )
            .catch((reason) =>
              console.error(
                `[FeedSummary] error reason from sendEmail :`,
                reason,
              ),
            );
          return;
        } else {
          setIsSaveSuccess(true);
          // Send log email
          await fetchAPI(
            "/api/sendEmail",
            {
              body: {
                type: "FeedForm SUCCESS",
                mMSourceFromDb: response.mMSourceFromDb,
              },
            },
            session?.user?.accessToken,
          )
            .then((result) =>
              console.log(`[FeedSummary] result from sendEmail :`, result),
            )
            .catch((reason) =>
              console.error(
                `[FeedSummary] error reason from sendEmail :`,
                reason,
              ),
            );
        }
        setIsSubmitting(false);
      })
      .catch((error) => {
        console.log("error in /api/feedForm", error);
        setIsSaveSuccess(false);
        setIsSubmitting(false);
      });
  };

  const onInfoModalOpen = (modalId: string) => {
    //@ts-ignore => Daisy UI modal has an unconventional showModal method
    document?.getElementById(modalId)?.showModal();
  };

  useEffect(() => {
    if (typeof isSaveSuccess !== "boolean") return;

    onInfoModalOpen(SAVE_INFO_MODAL_ID);
  }, [isSaveSuccess]);

  const onReset = () => {
    localStorage.removeItem(SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY);
    localStorage.removeItem(COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY);
    localStorage.removeItem(FEED_FORM_LOCAL_STORAGE_KEY);
    initFeedForm(dispatch);
  };

  // Helper function to render movement sections with styling
  const renderSection = (section: any) => {
    return (
      <div
        key={section.id}
        className="px-3 py-2 border-l-2 border-l-secondary/10 hover:border-l-secondary bg-secondary/5 transition-all duration-150 rounded-r-lg mb-3"
      >
        <div className="mb-2">
          <h6 className="text-sm font-bold text-secondary">
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
            <div className="text-xs italic px-2 py-1 bg-warning/10 rounded mt-2">
              Review note: {section.commentForReview}
            </div>
          )}
        </div>

        <div className="text-xs space-y-3">
          {section.metronomeMarks &&
            section.metronomeMarks.map((mm: any, idx: number) => {
              if (mm.noMM) {
                return (
                  <div key={idx} className="italic">
                    No metronome mark indicated
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
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  // Main render function for the source details
  const renderStylizedSourceDetails = () => {
    if (!mMSourceToPersist) return null;

    const { pieceVersions = [] } = mMSourceToPersist;

    return (
      <ul className="space-y-6 mb-6">
        {/* Source Information Card */}
        <li className="border border-base-300 rounded-lg hover:border-base-400 hover:shadow-md hover:bg-primary/5 transition-all duration-150">
          <div className="rounded-lg border-l-2 border-l-info/10 hover:border-l-info transition-all duration-150">
            <div className="px-4 py-3 bg-info/10 border-b border-info/20">
              {mMSourceToPersist.title && (
                <h2 className="text-lg font-bold text-info">
                  {mMSourceToPersist.title}
                </h2>
              )}
              <div className="flex text-base text-info/70 gap-3">
                {mMSourceToPersist.type && (
                  <div className="pr-3 border-r border-info/20">
                    {`${getSourceTypeLabel(mMSourceToPersist.type)}`}
                  </div>
                )}
                <div>
                  {mMSourceToPersist.year ? (
                    `${mMSourceToPersist.year}`
                  ) : (
                    <span className="italic">
                      No year of publication provided
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 text-sm">
              {mMSourceToPersist.link && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="font-semibold">Link: </span>
                  <a
                    href={getIMSLPPermaLink(mMSourceToPersist.link)}
                    target="_blank"
                    rel="noreferrer"
                    className="link link-primary break-all"
                  >
                    {mMSourceToPersist.link}
                  </a>
                </div>
              )}

              {mMSourceToPersist.references &&
                mMSourceToPersist.references.length > 0 && (
                  <div className="mb-3">
                    <h4 className="uppercase text-xs text-primary font-semibold mb-1">
                      References
                    </h4>
                    <ul className="list-disc pl-5">
                      {mMSourceToPersist.references.map(
                        (ref: any, idx: number) => (
                          <li key={idx} className="mb-1">
                            <span className="font-medium">
                              {getReferenceTypeLabel(ref.type)}:{" "}
                            </span>
                            {ref.reference}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

              {mMSourceToPersist.contributions &&
                mMSourceToPersist.contributions.length > 0 && (
                  <div className="">
                    <h4 className="uppercase text-xs text-primary font-semibold mb-1">
                      Contributors
                    </h4>
                    <ul className="list-disc pl-5">
                      {mMSourceToPersist.contributions.map(
                        (contribution: any, idx: number) => (
                          <li key={idx}>
                            <span className="font-medium">
                              {getRoleLabel(contribution.role)}:{" "}
                            </span>
                            {contribution.person
                              ? `${contribution.person.firstName} ${contribution.person.lastName}`
                              : contribution.organization?.name}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        </li>

        {/* Pieces */}
        {pieceVersions.map((pvs: any, index: number) => {
          const pieceVersion = pvs.pieceVersion;
          const piece = pieceVersion?.piece;
          const collection = piece?.collection;
          const composer = piece?.composer;

          if (!pieceVersion) return null;

          return (
            <li
              key={`piece-${index}`}
              className="border border-base-300 rounded-lg hover:border-base-400 hover:shadow-md hover:bg-primary/5 transition-all duration-150"
            >
              <div className="rounded-lg border-l-2 border-l-accent/10 hover:border-l-accent transition-all duration-150">
                {/* Collection Header if applicable */}
                {collection && (
                  <div className="px-4 py-2 bg-primary/10 border-b border-primary/20">
                    <h4 className="text-md font-bold text-primary">
                      Collection: {collection.title}
                    </h4>
                  </div>
                )}

                {/* Piece Header */}
                <div className="px-4 py-3 bg-accent/10 border-b border-accent/20">
                  <div className="flex gap-4 items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-accent">
                        {piece?.title}
                        <span className="text-base font-normal">
                          {composer &&
                            ` - ${composer.firstName} ${composer.lastName}`}
                        </span>
                      </h3>
                      <div className="text-sm text-accent/70 font-medium">
                        {piece?.yearOfComposition &&
                          `Composed: ${piece.yearOfComposition}`}
                        {pieceVersion?.category &&
                          ` • ${formatToPhraseCase(pieceVersion.category)}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Movements and Sections */}
                <div className="py-4 px-4">
                  {pieceVersion.movements &&
                    pieceVersion.movements.map(
                      (movement: any, mvtIndex: number) => (
                        <div key={`mvt-${mvtIndex}`} className="mb-4">
                          <div className="px-3 py-2 bg-primary/10 rounded-t-lg mb-2">
                            <h5 className="text-sm font-bold text-primary">
                              {pieceVersion.movements.length > 1
                                ? `Movement ${movement.rank}`
                                : ""}
                              {pieceVersion.movements.length > 0
                                ? pieceVersion.movements.length > 1
                                  ? " in "
                                  : ""
                                : ""}
                              {getKeyLabel(movement.key)}
                            </h5>
                          </div>

                          <div className="ml-2">
                            {movement.sections &&
                              movement.sections.map((section: any) =>
                                renderSection(section),
                              )}
                          </div>
                        </div>
                      ),
                    )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="mb-8">
      <h1 className="mb-4 text-4xl font-bold">Metronome Mark Source Summary</h1>
      {renderStylizedSourceDetails()}

      <div className="flex items-center gap-4 mt-6 justify-center">
        <button
          className="btn btn-primary btn-lg"
          type="button"
          onClick={saveAll}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-xs mr-2"></span>
              Saving...
            </>
          ) : (
            "Save the complete Metronome Mark Source"
          )}
        </button>
      </div>

      <InfoModal
        modalId={SAVE_INFO_MODAL_ID}
        type={isSaveSuccess ? "success" : "error"}
        description={
          isSaveSuccess
            ? "Your Metronome Mark Source and all the related data has been saved successfully. Thank you!"
            : "Oops! Something went wrong. We have been notified and we will try to fix the problem soon."
        }
        onClose={onReset}
      />
    </div>
  );
}

export default FeedSummary;
