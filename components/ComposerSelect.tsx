"use client";
import Select from "react-select";
import {
  useEditForm,
  updateEditForm,
} from "@/components/context/editFormContext";
import { ComposerState } from "@/types/editFormTypes";

type ComposerSelectProps = {
  composers: ComposerState[];
};
export default function ComposerSelect({ composers }: ComposerSelectProps) {
  const composerOptions = composers.map((composer) => ({
    value: composer.id,
    label: `${composer.firstName} ${composer.lastName}`,
  }));
  const { dispatch } = useEditForm();
  const onSelect = (composerId: string) => {
    const composer = composers.find((composer) => composer.id === composerId);
    // Update the composer in the context
    console.log(`[ComposerSelect] composer: ${composer}`);
    if (!composer) return;
    updateEditForm(dispatch, "composer", composer);
  };

  return (
    <Select
      instanceId="composer-select"
      defaultValue={composerOptions[0]}
      isSearchable={true}
      name="color"
      options={composerOptions}
      autoFocus
      onChange={(composerOption) => {
        if (!composerOption) return;
        onSelect(composerOption?.value);
      }}
    />
  );
}
