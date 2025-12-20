import React, { useEffect, useState } from "react";
import { initFeedForm, useFeedForm } from "@/context/feedFormContext";
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
import getKeyLabel from "@/utils/getKeyLabel";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import getSourceTypeLabel from "@/utils/getSourceTypeLabel";
import getReferenceTypeLabel from "@/utils/getReferenceTypeLabel";
import getIMSLPPermaLink from "@/utils/getIMSLPPermaLink";
import getRoleLabel from "@/utils/getRoleLabel";
import { SectionDetail } from "@/features/section/ui/SectionDetail";
import { displaySourceYear } from "@/utils/displaySourceYear";

const SAVE_INFO_MODAL_ID = "save-info-modal";
const InfoModal = dynamic(() => import("@/ui/modal/InfoModal"), {
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

  // Utility function to organize piece versions into groups by collection
  function processPieceVersionsForDisplay(pieceVersions: any[]) {
    const processedGroups: Array<{
      type: "collection" | "single";
      collection?: any;
      pieces: Array<{
        pieceVersion: any;
        piece: any;
        composer: any;
      }>;
    }> = [];

    let currentGroup: (typeof processedGroups)[0] | null = null;

    pieceVersions.forEach((pvs: any) => {
      const pieceVersion = pvs.pieceVersion;
      const piece = pieceVersion?.piece;
      const collection = piece?.collection;
      const composer = piece?.composer;

      if (!pieceVersion) return;

      // Determine if we need a new group
      const needNewGroup =
        !currentGroup ||
        (collection &&
          (currentGroup.type !== "collection" ||
            currentGroup.collection?.id !== collection.id)) ||
        (!collection &&
          (currentGroup.type !== "single" ||
            currentGroup.pieces.some((p) => p.piece.id !== piece.id)));

      if (needNewGroup) {
        currentGroup = {
          type: collection ? "collection" : "single",
          collection,
          pieces: [],
        };
        processedGroups.push(currentGroup);
      }

      // Add piece to current group
      currentGroup?.pieces.push({
        pieceVersion,
        piece,
        composer,
      });
    });

    return processedGroups;
  }

  // Main render function for the source details
  const renderStylizedSourceDetails = () => {
    if (!mMSourceToPersist) return null;

    const { pieceVersions = [] } = mMSourceToPersist;
    const organizedData = processPieceVersionsForDisplay(pieceVersions);

    const getPersonName = (person: any) => {
      return person ? `${person.firstName} ${person.lastName}` : "";
    };

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
                    `${displaySourceYear({ year: mMSourceToPersist.year, isYearEstimated: !!mMSourceToPersist.isYearEstimated })}`
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

        {/* Organized Pieces */}
        {organizedData.map((group, groupIndex) => {
          if (group.type === "collection") {
            // Get composer from the first piece (since all pieces in collection have same composer)
            const composer = group.pieces[0]?.composer;

            return (
              <li key={`collection-${group.collection.id}-${groupIndex}`}>
                {/* Collection Container with unified border */}
                <div className="border-l-2 border-l-warning/10 hover:border-l-warning rounded-lg transition-all duration-150">
                  {/* Collection Header */}
                  <div className="px-4 py-3 bg-warning/10 border-b border-warning/20">
                    <div className="flex gap-4 items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-warning mb-1">
                          {group.collection.title}
                          <span className="text-base font-normal">
                            {composer && ` - ${getPersonName(composer)}`}
                          </span>
                        </h3>
                        <div className="text-sm text-warning/70 font-medium">
                          {`Collection\u2002•\u2002${group.pieces.length} piece${group.pieces.length > 1 ? "s" : ""}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collection Pieces */}
                  <div className="pt-2 pl-2 grid-cols-1 space-y-2">
                    {group.pieces.map((pieceGroup) => {
                      const { pieceVersion, piece } = pieceGroup;
                      const movementCount = pieceVersion.movements?.length || 0;
                      const isMonoMovementPiece = movementCount === 1;

                      return (
                        <div
                          key={`${piece.id}-${pieceVersion.id}`}
                          className="border border-base-300 rounded-lg border-l-2 border-l-accent/10 hover:border-l-accent hover:border-base-400 hover:shadow-md hover:bg-primary/5 transition-all duration-150"
                        >
                          {/* Piece Header */}
                          <div className="px-4 py-3 bg-accent/10 border-b border-accent/20">
                            <h4 className="text-lg font-bold text-accent">
                              {piece?.title}
                              {isMonoMovementPiece &&
                                pieceVersion.movements?.[0] &&
                                ` in ${getKeyLabel(pieceVersion.movements[0].key)}`}
                            </h4>
                            <div className="text-sm text-accent/70 font-medium">
                              {piece?.yearOfComposition ? (
                                `Year of Composition: ${piece.yearOfComposition}`
                              ) : (
                                <span className="italic">
                                  No year of composition provided
                                </span>
                              )}
                              {pieceVersion?.category &&
                                `\u2002•\u2002Category: ${formatToPhraseCase(pieceVersion.category)}`}
                            </div>
                          </div>

                          {/* Movements and Sections */}
                          <div className="py-2">
                            {pieceVersion.movements &&
                              pieceVersion.movements.map(
                                (movement: any, mvtIndex: number) => (
                                  <div
                                    key={`mvt-${mvtIndex}`}
                                    className={
                                      isMonoMovementPiece
                                        ? ""
                                        : `ml-2 rounded-tl-lg border-l-2 border-l-primary/10 hover:border-l-primary transition-all duration-150`
                                    }
                                  >
                                    {!isMonoMovementPiece && (
                                      <div
                                        className={`px-4 py-2 ${mvtIndex > 0 ? "mt-3" : ""} bg-primary/5`}
                                      >
                                        <h5 className="text-sm font-bold text-primary">
                                          Movement {movement.rank} in{" "}
                                          {getKeyLabel(movement.key)}
                                        </h5>
                                      </div>
                                    )}

                                    <div
                                      className={`ml-2 ${isMonoMovementPiece ? "" : "pt-2"} grid-cols-1 space-y-1`}
                                    >
                                      {movement.sections &&
                                        movement.sections.map(
                                          (section: any) => (
                                            <SectionDetail
                                              key={section.id}
                                              section={section}
                                            />
                                          ),
                                        )}
                                    </div>
                                  </div>
                                ),
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </li>
            );
          } else {
            // Single piece (not part of a collection)
            const pieceGroup = group.pieces[0];
            const { pieceVersion, piece, composer } = pieceGroup;
            const movementCount = pieceVersion.movements?.length || 0;
            const isMonoMovementPiece = movementCount === 1;

            return (
              <li
                key={`single-${piece.id}-${pieceVersion.id}`}
                className="border border-base-300 rounded-lg hover:border-base-400 hover:shadow-md hover:bg-primary/5 transition-all duration-150"
              >
                <div className="rounded-lg border-l-2 border-l-accent/10 hover:border-l-accent transition-all duration-150">
                  {/* Single Piece Header */}
                  <div className="px-4 py-3 bg-accent/10 border-b border-accent/20">
                    <div className="flex gap-4 items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-accent">
                          {piece?.title}
                          {isMonoMovementPiece &&
                            pieceVersion.movements?.[0] &&
                            ` in ${getKeyLabel(pieceVersion.movements[0].key)}`}
                          <span className="text-base font-normal">
                            {composer && ` - ${getPersonName(composer)}`}
                          </span>
                        </h3>
                        <div className="text-sm text-accent/70 font-medium">
                          {piece?.yearOfComposition ? (
                            `Year of Composition: ${piece.yearOfComposition}`
                          ) : (
                            <span className="italic">
                              No year of composition provided
                            </span>
                          )}
                          {pieceVersion?.category &&
                            `\u2002•\u2002Category: ${formatToPhraseCase(pieceVersion.category)}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Movements and Sections */}
                  <div className="py-2">
                    {pieceVersion.movements &&
                      pieceVersion.movements.map(
                        (movement: any, mvtIndex: number) => (
                          <div
                            key={`mvt-${mvtIndex}`}
                            className={
                              isMonoMovementPiece
                                ? ""
                                : `ml-2 rounded-tl-lg border-l-2 border-l-primary/10 hover:border-l-primary transition-all duration-150`
                            }
                          >
                            {!isMonoMovementPiece && (
                              <div
                                className={`px-4 py-2 ${mvtIndex > 0 ? "mt-3" : ""} bg-primary/5`}
                              >
                                <h5 className="text-sm font-bold text-primary">
                                  Movement {movement.rank} in{" "}
                                  {getKeyLabel(movement.key)}
                                </h5>
                              </div>
                            )}

                            <div
                              className={`ml-2 ${isMonoMovementPiece ? "" : "pt-2"} grid-cols-1 space-y-1`}
                            >
                              {movement.sections &&
                                movement.sections.map((section: any) => (
                                  <SectionDetail
                                    key={section.id}
                                    section={section}
                                  />
                                ))}
                            </div>
                          </div>
                        ),
                      )}
                  </div>
                </div>
              </li>
            );
          }
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
