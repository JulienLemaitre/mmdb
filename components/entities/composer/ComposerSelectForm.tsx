import ComposerSelect from "@/components/entities/composer/ComposerSelect";
import { useEffect, useState } from "react";
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

  // Reset the form context when the component is mounted
  useEffect(() => {
    // Init the form with context value if exists
    if (value) {
      onSelect(value.id);
    }
  }, []);

  const onSelect = (composerId: string) => {
    const composer = composers.find((composer) => composer.id === composerId);
    console.log(`[ComposerSelectForm] onSelect:`, composer);
    if (!composer) return;
    setSelectedComposer(composer);
  };

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
