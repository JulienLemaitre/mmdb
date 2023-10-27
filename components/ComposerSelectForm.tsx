"use client";
import ComposerSelect from "@/components/ComposerSelect";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import { EDITION_PIECE_URL } from "@/utils/routes";
import { ComposerState } from "@/types/editFormTypes";
import { useState } from "react";
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

  const onSelect = (composerId: string) => {
    const composer = composers.find((composer) => composer.id === composerId);
    console.log(`[ComposerSelectForm] onSelect: ${composer}`);
    if (!composer) return;
    setSelectedComposer(composer);
  };
  const onSubmit = () => {
    updateEditForm(dispatch, "composer", selectedComposer);
    router.push(EDITION_PIECE_URL + "?composerId=" + selectedComposer?.id);
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
