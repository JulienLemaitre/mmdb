import React, { useState } from "react";
import {
  initFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { URL_API_FEEDFORM_SUBMIT } from "@/utils/routes";

function FeedSummary() {
  const [isSaveSuccess, setIsSaveSuccess] = useState<boolean>();
  const { state, dispatch } = useFeedForm();

  const saveAll = () => {
    fetch(URL_API_FEEDFORM_SUBMIT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    })
      .then((res) => res.json())
      .then((response) => {
        console.log("response", response);
        // initFeedForm(dispatch);
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
