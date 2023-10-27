// "use client";
import Select from "react-select";
import { ComposerState } from "@/types/editFormTypes";
import { useRouter } from "next/navigation";
import { CREATION_COMPOSER_URL } from "@/utils/routes";

type ComposerSelectProps = {
  composers: ComposerState[];
  onSelect: (composerId: string) => void;
};
export default function ComposerSelect({
  composers,
  onSelect,
}: ComposerSelectProps) {
  const composerOptions = composers.map((composer) => ({
    value: composer.id,
    label: `${composer.firstName} ${composer.lastName}`,
  }));
  const router = useRouter();

  return (
    <Select
      instanceId="composer-select"
      isSearchable={true}
      name="composer"
      options={composerOptions}
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
              router.push(CREATION_COMPOSER_URL);
            }}
          >
            Create a new composer
          </button>
        </div>
      )}
    />
  );
}
