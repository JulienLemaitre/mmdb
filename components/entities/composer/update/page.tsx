"use client";

import ComposerEditForm from "@/components/entities/composer/ComposerEditForm";
import { useEditForm } from "@/components/context/editFormContext";
import { useEffect, useState } from "react";
import { ComposerState } from "@/types/editFormTypes";
import Loader from "@/components/Loader";

export default function ComposerUpdate({ searchParams: { personId } }) {
  const { state } = useEditForm();
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [isComposerInitialized, setIsComposerInitialized] = useState(false);

  useEffect(() => {
    const stateComposer = state.composer;

    // If no personId is provided, we get the person initial value from the form context
    if (!personId) {
      console.log(`[ComposerUpdate] personId is undefined, get context value`);
      if (!stateComposer) {
        console.log(`[ComposerUpdate] ERROR: context composer is undefined`);
        setIsComposerInitialized(true);
        return;
      }
      setComposer(stateComposer);
      setIsComposerInitialized(true);
      return;
    }

    // if a personId is provided, we check if it is already in the form context to initialize the person value
    if (stateComposer && stateComposer.id === personId) {
      console.log(`[ComposerUpdate] personId is in context`);
      setComposer(stateComposer);
      setIsComposerInitialized(true);
      return;
    }

    // If we didn't find the provided personId in context, we fetch the person data from db
    fetch(`/api/person/get/${personId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        console.log(`[ComposerUpdate getData] composer :`, data);
        setComposer(data);
        setIsComposerInitialized(true);
      })
      .catch((error) => {
        console.log(`[ComposerUpdate] ERROR:`, error);
        setIsComposerInitialized(true);
      });
  }, []);

  if (!isComposerInitialized) {
    return <Loader />;
  }

  if (!composer) {
    return (
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-4xl font-bold">Composer update error</h1>
        <p className="mb-4 text-lg">
          The composer you are trying to update was not found.
        </p>
      </div>
    );
  }

  console.log(`[ComposerUpdate] initial composer value :`, composer);

  return <ComposerEditForm composer={composer} />;
}
