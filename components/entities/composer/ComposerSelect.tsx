// "use client";
import Select from "@/components/ReactSelect/Select";
import { PersonState } from "@/types/formTypes";
import { useRouter } from "next/navigation";
import getNoOptionsMessage from "@/components/ReactSelect/getNoOptionsMessage";
import getPersonName from "@/components/entities/person/utils/getPersonName";

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
  const router = useRouter();
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
    label: getPersonName(composer),
  };
}
