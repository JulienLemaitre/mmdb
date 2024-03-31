"use client";

import SourceDescriptionEditForm from "@/app/(signedIn)/edition/source-description/SourceDescriptionEditForm";
import getSourceDescriptionStateFromInput from "@/utils/getSourceDescriptionStateFromInput";
import { SourceDescriptionInput } from "@/types/editFormTypes";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import { URL_CREATE_SOURCE_CONTRIBUTIONS } from "@/utils/routes";
import { useRouter } from "next/navigation";

export default function CreateSourceDescription() {
  const { state, dispatch } = useEditForm();
  const router = useRouter();

  const onSubmit = async (data: SourceDescriptionInput) => {
    // Front input values validation is successful at this point.
    console.log("data", data);

    const sourceData = data;
    // Remove null values from sourceData
    Object.keys(sourceData).forEach(
      (key) => sourceData[key] == null && delete sourceData[key],
    );

    if (!state.pieceVersion) {
      console.warn("No pieceVersion in state to link to the source");
      return;
    }

    //TODO: for Source Description, Contributions and Metronome Marks, we will keep the data in state only and send to API once the user has completed all of them.

    const sourceDescriptionState = getSourceDescriptionStateFromInput({
      ...sourceData,
      // pieceVersions: [state.pieceVersion.id],
    });

    sourceDescriptionState.isNew = true;
    console.log(
      "source description to be stored in state",
      sourceDescriptionState,
    );
    updateEditForm(dispatch, "sourceDescription", sourceDescriptionState);
    router.push(URL_CREATE_SOURCE_CONTRIBUTIONS);
  };

  return <SourceDescriptionEditForm onSubmit={onSubmit} />;
}
