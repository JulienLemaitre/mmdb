// "use client";
import Select from "@/components/ReactSelect/Select";
import { ComposerState } from "@/types/editFormTypes";
import { useRouter } from "next/navigation";
import { URL_CREATE_COMPOSER } from "@/utils/routes";
import getNoOptionsMessage from "@/components/ReactSelect/getNoOptionsMessage";

type ComposerSelectProps = {
  composers: ComposerState[];
  onSelect: (composerId: string) => void;
  selectedComposer: ComposerState | null;
};
export default function ComposerSelect({
  composers,
  onSelect,
  selectedComposer,
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
        router,
        entityName: "composer",
        createUrl: URL_CREATE_COMPOSER,
      })}
    />
  );
}

function getComposerOption(composer: ComposerState) {
  return {
    value: composer.id,
    label: `${composer.firstName} ${composer.lastName}`,
  };
}