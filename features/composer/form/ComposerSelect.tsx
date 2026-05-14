// "use client";
import Select from "@/ui/form/reactSelect/Select";
import { PersonState } from "@/types/formTypes";
import getNoOptionsMessage from "@/ui/form/reactSelect/getNoOptionsMessage";
import { formatPersonOption, getPersonOption } from "@/features/composer/utils";

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
    <Select
      className="react-select-container"
      classNamePrefix="react-select"
      instanceId="composer-select"
      placeholder="Enter composer name..."
      isSearchable={true}
      name="composer"
      options={composerOptions}
      formatOptionLabel={(option) => formatPersonOption(option)}
      defaultValue={defaultOption}
      autoFocus
      onChange={(composerOption) => {
        if (!composerOption) return;
        onSelect(composerOption?.value);
      }}
      noOptionsMessage={getNoOptionsMessage({
        entityName: "composer",
        onClick: onInitComposerCreation,
      })}
    />
  );
}
