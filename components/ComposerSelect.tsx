"use client";
import Select from "react-select";
import {
  useEditForm,
  updateEditForm,
} from "@/components/context/editFormContext";
import { ComposerState } from "@/types/editFormTypes";
import { useRouter } from "next/navigation";
import { CREATION_COMPOSER_URL } from "@/utils/routes";

type ComposerSelectProps = {
  composers: ComposerState[];
};
export default function ComposerSelect({ composers }: ComposerSelectProps) {
  const composerOptions = composers.map((composer) => ({
    value: composer.id,
    label: `${composer.firstName} ${composer.lastName}`,
  }));
  const { dispatch } = useEditForm();
  const router = useRouter();
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
      // defaultValue={composerOptions[0]}
      isSearchable={true}
      name="color"
      options={composerOptions}
      autoFocus
      onChange={(composerOption) => {
        if (!composerOption) return;
        onSelect(composerOption?.value);
      }}
      // menuIsOpen={true}
      noOptionsMessage={() => (
        <div className="text-left">
          <div className="ml-4 mb-2">No composer found</div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              console.log("Create a new composer");
              await router.push(CREATION_COMPOSER_URL);
            }}
          >
            Create a new composer
          </button>
        </div>
      )}
    />
  );
}
