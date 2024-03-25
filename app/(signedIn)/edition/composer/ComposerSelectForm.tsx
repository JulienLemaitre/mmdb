"use client";
import ComposerSelect from "@/app/(signedIn)/edition/composer/ComposerSelect";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import { URL_SELECT_PIECE } from "@/utils/routes";
import { ComposerState } from "@/types/editFormTypes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ComposerSelectFormProps = {
  composers: ComposerState[];
};
export default function ComposerSelectForm({
  composers,
}: ComposerSelectFormProps) {
  const { dispatch, state } = useEditForm();
  const router = useRouter();
  const [selectedComposer, setSelectedComposer] =
    useState<ComposerState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset the form context when the component is mounted
  useEffect(() => {
    // Init the form with context value if exists
    if (state.composer) {
      onSelect(state.composer.id);
    }
  }, []);

  const onSelect = (composerId: string) => {
    const composer = composers.find((composer) => composer.id === composerId);
    console.log(`[ComposerSelectForm] onSelect:`, composer);
    if (!composer) return;
    setSelectedComposer(composer);
  };
  const onSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    updateEditForm(dispatch, "composer", selectedComposer);
    router.push(URL_SELECT_PIECE + "?composerId=" + selectedComposer?.id);
  };

  // If we have a default value to set, we prevent an initial render of react-select that would prevent its use
  if (state.composer && !selectedComposer) {
    return null;
  }

  return (
    <>
      <ComposerSelect
        composers={composers}
        onSelect={onSelect}
        selectedComposer={selectedComposer}
      />
      <button
        className="btn btn-primary mt-4"
        onClick={onSubmit}
        {...(selectedComposer ? { disabled: false } : { disabled: true })}
      >
        {isSubmitting && (
          <span className="loading loading-spinner loading-md" />
        )}
        Choose Composer
      </button>
    </>
  );
}
