"use client";
import ComposerSelect from "@/app/(signedIn)/edition/composer/ComposerSelect";
import {
  initEditForm,
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import { SELECT_PIECE_URL } from "@/utils/routes";
import { ComposerState } from "@/types/editFormTypes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ComposerSelectFormProps = {
  composers: ComposerState[];
};
export default function ComposerSelectForm({
  composers,
}: ComposerSelectFormProps) {
  const { dispatch } = useEditForm();
  const router = useRouter();
  const [selectedComposer, setSelectedComposer] =
    useState<ComposerState | null>(null);

  // Reset the form context when the component is mounted
  useEffect(() => {
    console.log(`Reset the form context`);
    initEditForm(dispatch);
  }, []);

  const onSelect = (composerId: string) => {
    const composer = composers.find((composer) => composer.id === composerId);
    console.log(`[ComposerSelectForm] onSelect:`, composer);
    if (!composer) return;
    setSelectedComposer(composer);
  };
  const onSubmit = () => {
    updateEditForm(dispatch, "composer", selectedComposer);
    router.push(SELECT_PIECE_URL + "?composerId=" + selectedComposer?.id);
  };

  return (
    <>
      <ComposerSelect composers={composers} onSelect={onSelect} />
      <button
        className="btn btn-primary mt-4"
        onClick={onSubmit}
        {...(selectedComposer ? { disabled: false } : { disabled: true })}
      >
        Next
      </button>
    </>
  );
}