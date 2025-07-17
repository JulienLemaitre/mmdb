import React, { useEffect, useState } from "react";
import {
  initFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { URL_API_FEEDFORM_SUBMIT } from "@/utils/routes";
import { fetchAPI } from "@/utils/fetchAPI";
import { useSession } from "next-auth/react";
import MMSourceDetails from "@/components/MMSourceDetails";
import computeMMSourceToPersistFromState from "@/utils/computeMMSourceToPersistFromState";
import {
  COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
  FEED_FORM_LOCAL_STORAGE_KEY,
  SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";
import dynamic from "next/dynamic";

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

  return (
    <>
      <MMSourceDetails mMSource={mMSourceToPersist} />
      <div className="flex items-center gap-4">
        <button
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 border border-gray-400 rounded-sm mr-4"
          type="button"
          onClick={saveAll}
        >
          Save the complete Metronome Mark Source
        </button>
        {isSubmitting ? (
          <span className="loading loading-infinity loading-xl"></span>
        ) : null}
      </div>
      <InfoModal
        modalId={SAVE_INFO_MODAL_ID}
        type={isSaveSuccess ? "success" : "error"}
        description={
          isSaveSuccess
            ? "Your Metronome Mark Source and all the related data has been saved successfully. Thank you !"
            : "Oops ! Something went wrong. We have been notified and we will try to fix the problem soon."
        }
        onClose={onReset}
      />
    </>
  );
}

export default FeedSummary;
