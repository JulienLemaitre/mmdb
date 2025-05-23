import ComposerSelect from "@/components/entities/composer/ComposerSelect";
import { useCallback, useEffect, useState } from "react";
import { PersonState } from "@/types/formTypes";

type ComposerSelectFormProps = {
  composers: PersonState[];
  value?: PersonState;
  onComposerSelect: (event: any) => void;
  onComposerCreationClick: () => void;
};
export default function ComposerSelectForm({
  composers,
  value,
  onComposerSelect,
  onComposerCreationClick,
}: ComposerSelectFormProps) {
  const [selectedComposer, setSelectedComposer] = useState<PersonState | null>(
    value || null,
  );

  const onSelect = useCallback(
    (composerId: string) => {
      const composer = composers.find((composer) => composer.id === composerId);
      if (!composer) return;
      setSelectedComposer(composer);
    },
    [composers],
  );

  // Reset the form context when the component is mounted
  useEffect(() => {
    // Init the form with context value if exists
    if (value?.id) {
      onSelect(value.id);
    }
  }, [onSelect, value?.id]);

  // If we have a default value to set, we prevent an initial render of react-select that would prevent its use
  if (value && !selectedComposer) {
    return null;
  }

  return (
    <>
      <ComposerSelect
        composers={composers}
        onSelect={onSelect}
        selectedComposer={selectedComposer}
        onComposerCreationClick={onComposerCreationClick}
      />
      <button
        className="btn btn-primary mt-4"
        onClick={() => onComposerSelect(selectedComposer)}
        {...(selectedComposer ? { disabled: false } : { disabled: true })}
      >
        Choose Composer
      </button>
    </>
  );
}
