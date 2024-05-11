import React, { useState } from "react";
import {
  // initFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { URL_API_FEEDFORM_SUBMIT } from "@/utils/routes";
import { fetchAPI } from "@/utils/fetchAPI";
import { useSession } from "next-auth/react";
import DebugBox from "@/components/DebugBox";

function FeedSummary() {
  const [isSaveSuccess, setIsSaveSuccess] = useState<boolean>();
  const [savedValues, setSavedValues] = useState<any>();
  const { state } = useFeedForm();
  const { data: session } = useSession();

  const saveAll = () => {
    fetchAPI(
      URL_API_FEEDFORM_SUBMIT,
      {
        variables: state,
      },
      session?.user?.accessToken,
    )
      .then((response) => {
        console.log("response", response);
        // initFeedForm(dispatch);
        setSavedValues(response);
        setIsSaveSuccess(true);
      })
      .catch((error) => {
        console.log("error", error);
        // initFeedForm(dispatch);
        setIsSaveSuccess(false);
      });
  };

  if (isSaveSuccess === true) {
    return (
      <div>
        <div>Voilà ! All has been saved successfully.</div>
        <div>Thank you.</div>
        <DebugBox stateObject={savedValues} />
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
      </div>
    );
  }

  return (
    <button
      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 border border-gray-400 rounded"
      type="button"
      onClick={saveAll}
    >
      Save the complete Metronome Mark Source
    </button>
  );
}

export default FeedSummary;
