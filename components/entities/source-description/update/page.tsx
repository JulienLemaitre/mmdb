"use client";

import SourceDescriptionEditForm from "@/components/entities/source-description/SourceDescriptionEditForm";
import { useEditForm } from "@/components/context/editFormContext";
import { useEffect, useState } from "react";
import { MMSourceDescriptionState } from "@/types/formTypes";
import Loader from "@/components/Loader";
import getSourceDescriptionInputFromState from "@/utils/getSourceDescriptionInputFromState";

export default function SourceDescriptionUpdate({
  searchParams: { sourceDescriptionId },
}) {
  const { state } = useEditForm();
  const [sourceDescription, setSourceDescription] =
    useState<MMSourceDescriptionState | null>(null);
  const [isSourceDescriptionInitialized, setIsSourceDescriptionInitialized] =
    useState(false);

  useEffect(() => {
    const stateSourceDescription = state.sourceDescription;

    if (!sourceDescriptionId) {
      console.log(
        `[SourceDescriptionUpdate] sourceDescriptionId is undefined, get context value`,
      );
      if (!stateSourceDescription) {
        console.log(
          `[SourceDescriptionUpdate] ERROR: context sourceDescription is undefined`,
        );
        setIsSourceDescriptionInitialized(true);
        return;
      }
      setSourceDescription(stateSourceDescription);
      setIsSourceDescriptionInitialized(true);
      return;
    }

    if (
      stateSourceDescription &&
      stateSourceDescription?.id === sourceDescriptionId
    ) {
      console.log(
        `[SourceDescriptionUpdate] sourceDescriptionId is in context`,
      );
      setSourceDescription(stateSourceDescription);
      setIsSourceDescriptionInitialized(true);
      return;
    }

    fetch(`/api/source-description/get/${sourceDescriptionId}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(
          `[SourceDescriptionUpdate getData] sourceDescription :`,
          data,
        );
        setSourceDescription(data);
        setIsSourceDescriptionInitialized(true);
      })
      .catch((error) => {
        console.log(`[SourceDescriptionUpdate] ERROR:`, error);
        setIsSourceDescriptionInitialized(true);
      });
  }, []);

  if (!isSourceDescriptionInitialized) {
    return <Loader />;
  }

  if (!sourceDescription) {
    return (
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-4xl font-bold">
          Source description update error
        </h1>
        <p className="mb-4 text-lg">
          The source description you are trying to update was not found.
        </p>
      </div>
    );
  }

  const sourceDescriptionInput =
    getSourceDescriptionInputFromState(sourceDescription);

  return (
    <>
      {/*<SourceDescriptionEditForm sourceDescription={sourceDescriptionInput} />*/}
    </>
  );
}
