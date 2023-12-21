// "use client";
import Select from "react-select";
import { ComposerState } from "@/types/editFormTypes";
import { useRouter } from "next/navigation";
import { CREATE_COMPOSER_URL } from "@/utils/routes";

type ComposerSelectProps = {
  composers: ComposerState[];
  onSelect: (composerId: string) => void;
  selectedComposer: ComposerState | null;
};
export default function ComposerSelect({
  composers,
  onSelect,
  selectedComposer,
}: ComposerSelectProps) {
  const composerOptions = composers.map((composer) =>
    getComposerOption(composer),
  );
  const router = useRouter();
  const defaultOption = selectedComposer
    ? getComposerOption(selectedComposer)
    : null;
  console.log(`[ComposerSelect] defaultOption :`, defaultOption);

  return (
    <Select
      instanceId="composer-select"
      isSearchable={true}
      name="composer"
      options={composerOptions}
      defaultValue={defaultOption}
      autoFocus
      onChange={(composerOption) => {
        if (!composerOption) return;
        onSelect(composerOption?.value);
      }}
      noOptionsMessage={() => (
        <div className="text-left">
          <div className="ml-4 mb-2">No composer found</div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              console.log("Create a new composer");
              router.push(CREATE_COMPOSER_URL);
            }}
          >
            Create a new composer
          </button>
        </div>
      )}
    />
  );
}

function getComposerOption(composer: ComposerState) {
  return {
    value: composer.id,
    label: `${composer.firstName} ${composer.lastName}`,
  };
}
