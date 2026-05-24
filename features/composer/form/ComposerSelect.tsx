// "use client";
import { PersonState } from "@/types/formTypes";
import { formatPersonOption, getPersonOption } from "@/features/composer/utils";
import { filterPersonOption } from "@/utils/selectFilterOption";
import CreatableSelect from "react-select/creatable";

type ComposerSelectProps = {
  composers: PersonState[];
  onSelect: (composerId: string) => void;
  selectedComposer: PersonState | null;
  onInitComposerCreation: () => void;
};
export default function ComposerSelect({
  composers,
  onSelect,
  selectedComposer,
  onInitComposerCreation,
}: Readonly<ComposerSelectProps>) {
  const composerOptions = composers.map((composer) =>
    getPersonOption(composer),
  );
  const defaultOption = selectedComposer
    ? getPersonOption(selectedComposer)
    : null;

  return (
    <CreatableSelect
      className="react-select-container"
      classNamePrefix="react-select"
      instanceId="composer-select"
      placeholder="Enter composer name..."
      name="composer"
      options={composerOptions}
      formatOptionLabel={formatPersonOption}
      filterOption={filterPersonOption}
      defaultValue={defaultOption}
      autoFocus
      onChange={(composerOption) => {
        if (!composerOption) return;
        onSelect(composerOption?.value);
      }}
      onCreateOption={onInitComposerCreation}
    />
  );
}
