import React, { useState } from "react";
import {
  initFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { URL_API_FEEDFORM_SUBMIT } from "@/utils/routes";
import { fetchAPI } from "@/utils/fetchAPI";
import { useSession } from "next-auth/react";
import DebugBox from "@/components/DebugBox";
import LoadingSpinIcon from "@/components/svg/LoadingSpinIcon";
import MMSourceDetails from "@/components/MMSourceDetails";
import computeMMSourceToPersistFromState from "@/utils/computeMMSourceToPersistFromState";
import {
  COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
  FEED_FORM_LOCAL_STORAGE_KEY,
  SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";

function FeedSummary() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState<boolean>();
  const [submitResponse, setSubmitResponse] = useState<any>();
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
        // initFeedForm(dispatch);
        setSubmitResponse(response);
        setIsSubmitting(false);
      })
      .catch((error) => {
        console.log("error in /api/feedForm", error);
        // initFeedForm(dispatch);
        setIsSaveSuccess(false);
        setIsSubmitting(false);
      });
  };

  const onReset = () => {
    localStorage.removeItem(SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY);
    localStorage.removeItem(COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY);
    localStorage.removeItem(FEED_FORM_LOCAL_STORAGE_KEY);
    initFeedForm(dispatch);
  };

  if (isSaveSuccess === true) {
    return (
      <div>
        <div>Voilà ! All has been saved successfully.</div>
        <div>Thank you.</div>
        <button className="btn btn-primary" onClick={onReset}>
          Reset the form
        </button>
        {/*<div>Here is the data you saved :</div>*/}
        {/*<MMSourceDetails mMSource={submitResponse.mMSourceFromDb} />*/}
        <DebugBox
          title="Submit success return"
          stateObject={submitResponse}
          // shouldExpandNode={(level) => level < 3}
        />
      </div>
    );
  }

  if (isSaveSuccess === false) {
    return (
      <div>
        <div>Oops ! Something went wrong.</div>
        <div>
          We have been notified and we will try to fix the problem soon.
        </div>
        <DebugBox
          title="Submit Error"
          stateObject={submitResponse}
          shouldExpandNode={(level) => level < 3}
        />
      </div>
    );
  }

  return (
    <>
      <MMSourceDetails mMSource={mMSourceToPersist} />
      <div className="flex items-center">
        <button
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 border border-gray-400 rounded-sm mr-4"
          type="button"
          onClick={saveAll}
        >
          Save the complete Metronome Mark Source
        </button>
        {isSubmitting ? (
          <div className="w-6">
            <LoadingSpinIcon />
          </div>
        ) : null}
      </div>
    </>
  );
}

export default FeedSummary;
