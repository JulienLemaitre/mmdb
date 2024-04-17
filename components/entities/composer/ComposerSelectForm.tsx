import ComposerSelect from "@/components/entities/composer/ComposerSelect";
import { useState } from "react";
import { PersonState } from "@/types/formTypes";

type ComposerSelectFormProps = {
  composers: PersonState[];
  value?: PersonState;
  onComposerSelect: (event: any) => void;
};
export default function ComposerSelectForm({
  composers,
  value,
  onComposerSelect,
}: ComposerSelectFormProps) {
  // const { dispatch, state } = useEditForm();
  // const router = useRouter();
  const [selectedComposer, setSelectedComposer] = useState<PersonState | null>(
    value || null,
  );
  // const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // // Reset the form context when the component is mounted
  // useEffect(() => {
  //   // Init the form with context value if exists
  //   if (state.composer) {
  //     onSelect(state.composer.id);
  //   }
  // }, []);

  const onSelect = (composerId: string) => {
    const composer = composers.find((composer) => composer.id === composerId);
    console.log(`[ComposerSelectForm] onSelect:`, composer);
    if (!composer) return;
    setSelectedComposer(composer);
  };
  // const onSubmit = () => {
  //   if (isSubmitting) return;
  //   setIsSubmitting(true);
  //   updateEditForm(dispatch, "composer", selectedComposer);
  //   router.push(URL_SELECT_PIECE + "?composerId=" + selectedComposer?.id);
  // };

  // If we have a default value to set, we prevent an initial render of react-select that would prevent its use
  if (selectedComposer && !selectedComposer) {
    return null;
  }

  return (
    <>
      <ComposerSelect
        composers={composers}
        onSelect={onSelect}
        selectedComposer={selectedComposer}
      />
      <button
        className="btn btn-primary mt-4"
        onClick={() => onComposerSelect(selectedComposer)}
        {...(selectedComposer ? { disabled: false } : { disabled: true })}
      >
        {/*
        {isSubmitting && (
          <span className="loading loading-spinner loading-md" />
        )}
*/}
        Choose Composer
      </button>
    </>
  );
}
