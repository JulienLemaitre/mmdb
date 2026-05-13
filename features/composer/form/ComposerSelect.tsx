// "use client";
import Select from "@/ui/form/reactSelect/Select";
import { PersonState } from "@/types/formTypes";
import getNoOptionsMessage from "@/ui/form/reactSelect/getNoOptionsMessage";
import PersonStyled from "@/ui/PersonStyled";

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
    getComposerOption(composer),
  );
  const defaultOption = selectedComposer
    ? getComposerOption(selectedComposer)
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

function getComposerOption(composer: PersonState) {
  return {
    value: composer.id,
    label: PersonStyled({ person: composer }),
  };
}
