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

        <div className="grid grid-cols-2 gap-4">
          {/* Left column: Meter and Fastest Notes per Bar */}
          <div className="border-l-2 border-l-primary/10 hover:border-l-primary bg-primary/5 p-3 rounded-lg">
            <h5 className="text-xs font-bold text-primary mb-2">
              Meter & Fastest Notes per Bar
            </h5>
            <div className="text-xs space-y-1">
              {section.fastestStructuralNotesPerBar && (
                <div>
                  <span className="font-medium">Fastest structural notes:</span>{" "}
                  {section.fastestStructuralNotesPerBar}
                </div>
              )}
              {section.fastestRepeatedNotesPerBar && (
                <div>
                  <span className="font-medium">Fastest repeated notes:</span>{" "}
                  {section.fastestRepeatedNotesPerBar}
                </div>
              )}
              {section.fastestStaccatoNotesPerBar && (
                <div>
                  <span className="font-medium">Fastest staccato notes:</span>{" "}
                  {section.fastestStaccatoNotesPerBar}
                </div>
              )}
              {section.fastestOrnamentalNotesPerBar && (
                <div>
                  <span className="font-medium">Fastest ornamental notes:</span>{" "}
                  {section.fastestOrnamentalNotesPerBar}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Metronome Mark and Computed Notes per Second */}
          <div className="border-l-2 border-l-accent/10 hover:border-l-accent bg-accent/5 p-3 rounded-lg">
            <h5 className="text-xs font-bold text-accent mb-2">
              Metronome Mark & Notes per Second
            </h5>
            <div className="text-xs space-y-1">
              {section.metronomeMarks &&
                section.metronomeMarks.map((mm: any, idx: number) => {
                  if (mm.noMM) {
                    return (
                      <div key={idx} className="italic">
                        No metronome mark indicated
                      </div>
                    );
                  }

                  return (
                    <div key={idx}>
                      <div>
                        <span className="font-medium">Metronome mark:</span>{" "}
                        {getNoteValueLabel(mm.beatUnit)} = {mm.bpm}
                      </div>
                      {mm.notesPerSecond &&
                        [
                          {
                            key: "fastestStructuralNotesPerSecond",
                            label: "Structural",
                          },
                          {
                            key: "fastestRepeatedNotesPerSecond",
                            label: "Repeated",
                          },
                          {
                            key: "fastestStaccatoNotesPerSecond",
                            label: "Staccato",
                          },
                          {
                            key: "fastestOrnamentalNotesPerSecond",
                            label: "Ornamental",
                          },
                        ].map(
                          (type) =>
                            mm.notesPerSecond[type.key] && (
                              <div key={type.key}>
                                <span className="font-medium">
                                  {type.label} notes/sec:
                                </span>{" "}
                                {mm.notesPerSecond[type.key].toFixed(2)}
                              </div>
                            ),
                        )}
                      {mm.comment && (
                        <div className="mt-1 italic">Comment: {mm.comment}</div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
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
          <div className="rounded-lg border-l-2 border-l-warning/10 hover:border-l-warning transition-all duration-150">
            <div className="px-4 py-3 bg-warning/10 border-b border-warning/20">
              <h3 className="text-lg font-bold text-warning">
                Metronome Mark Source
                <span className="text-base font-normal ml-2">
                  {mMSourceToPersist.year ? `(${mMSourceToPersist.year})` : ""}
                </span>
              </h3>
              <div className="text-sm text-warning/70 font-medium">
                {mMSourceToPersist.type &&
                  `Type: ${getSourceTypeLabel(mMSourceToPersist.type)}`}
                {mMSourceToPersist.title && ` • ${mMSourceToPersist.title}`}
              </div>
            </div>

            <div className="p-4">
              {mMSourceToPersist.link && (
                <div className="mb-2">
                  <span className="font-semibold">Link: </span>
                  <a
                    href={mMSourceToPersist.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline break-all"
                  >
                    {mMSourceToPersist.link}
                  </a>
                </div>
              )}

              {mMSourceToPersist.references &&
                mMSourceToPersist.references.length > 0 && (
                  <div className="mb-2">
                    <h4 className="font-semibold mb-1">References:</h4>
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
                  <div className="mb-2">
                    <h4 className="font-semibold mb-1">Contributors:</h4>
                    <ul className="list-disc pl-5">
                      {mMSourceToPersist.contributions.map(
                        (contribution: any, idx: number) => (
                          <li key={idx}>
                            <span className="font-medium">
                              {contribution.role}:{" "}
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
